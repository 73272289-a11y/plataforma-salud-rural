import { HealthCenterUseCase } from '../../domain/use-cases/HealthCenterUseCase.js';
import { SupabaseStorageAdapter } from '../output/SupabaseStorageAdapter.js';
import { Patient } from '../../domain/models/Patient.js';
import { Triage } from '../../domain/models/Triage.js';

const storageAdapter = new SupabaseStorageAdapter();
// Mapeamos los métodos del adaptador de salida para cumplir con ambos puertos
const useCase = new HealthCenterUseCase(
    storageAdapter,
    {
        obtenerDesdeServidorCentral: () => storageAdapter.obtenerDesdeServidorCentralTriajes(),
        obtenerDesdeCacheLocal: () => storageAdapter.obtenerDesdeCacheLocalTriajes(),
        guardarEnServidorCentral: (triage) => storageAdapter.guardarEnServidorCentralTriaje(triage),
        guardarEnCacheLocal: (triage) => storageAdapter.guardarEnCacheLocalTriaje(triage),
        limpiarCacheLocal: () => storageAdapter.limpiarCacheLocalTriajes()
    }
);

let esOnline = true;
let padronPacientes = [];
let historialTriajes = [];

document.addEventListener('DOMContentLoaded', async () => {
    asociarEventosDirectos();
    await inicializarFlujoDatos();
});

function asociarEventosDirectos() {
    const btnCorte = document.getElementById('btn-simular-corte');
    const btnPac = document.getElementById('btn-guardar-paciente');
    const btnTri = document.getElementById('btn-guardar-triaje');

    if (btnCorte) btnCorte.addEventListener('click', gestionarAlternanciaRed);
    if (btnPac) btnPac.addEventListener('click', procesarGuardadoPaciente);
    if (btnTri) btnTri.addEventListener('click', procesarGuardadoTriaje);
}

async function inicializarFlujoDatos() {
    try {
        const { pacientes, triajes } = await useCase.inicializarFlujoDatos(esOnline);
        padronPacientes = pacientes;
        historialTriajes = triajes;
    } catch (err) {
        console.error("Fallo de red cloud, aplicando contingencia local:", err);
        padronPacientes = await storageAdapter.obtenerDesdeCacheLocal();
        historialTriajes = await storageAdapter.obtenerDesdeCacheLocalTriajes();
    }
    reconstruirSelectDesplegable();
    renderizarTablasKPIs();
}

async function gestionarAlternanciaRed(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    esOnline = !esOnline;

    const estadoConexion = document.getElementById('estado-conexion');
    const btnSimularCorte = document.getElementById('btn-simular-corte');
    const textoConexion = document.getElementById('texto-conexion');

    if (!estadoConexion || !btnSimularCorte || !textoConexion) return;

    if (esOnline) {
        estadoConexion.style.background = '#e6fffa';
        estadoConexion.style.color = '#00a389';
        textoConexion.textContent = '🌐 CONECTADO A BASE DE DATOS CENTRAL (SUPABASE)';
        btnSimularCorte.textContent = '❌ Simular Corte de Señal (Modo Offline)';
        btnSimularCorte.style.background = '#e53e3e';

        mostrarAlertaInformativa("🔄 Conexión restablecida. Sincronizando datos retenidos con PostgreSQL...", "info");
        await useCase.sincronizarDatosRetenidos();
        await inicializarFlujoDatos();
    } else {
        estadoConexion.style.background = '#fffaf0';
        estadoConexion.style.color = '#dd6b20';
        textoConexion.textContent = '⚠️ MODO OFFLINE ACTIVADO (RESILIENCIA LOCAL)';
        btnSimularCorte.textContent = '🔄 Restablecer Conexión Centralizada';
        btnSimularCorte.style.background = '#3182ce';
        mostrarAlertaInformativa("⚠️ Red satelital nula. Operando en almacenamiento de contingencia local.", "warning");
    }
}

async function procesarGuardadoPaciente(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const inputNombre = document.getElementById('nuevo-nombre');
    const inputLugar = document.getElementById('nuevo-lugar');
    const inputSexo = document.getElementById('nuevo-sexo');
    const inputEdad = document.getElementById('nuevo-edad');

    if (!inputNombre || !inputLugar || !inputSexo || !inputEdad) return;

    const datosPaciente = {
        nombre: inputNombre.value.trim(),
        comunidad: inputLugar.value.trim(),
        sexo: inputSexo.value,
        edad: parseInt(inputEdad.value, 10)
    };

    const pacienteVisual = new Patient(datosPaciente);
    padronPacientes.unshift(pacienteVisual);
    reconstruirSelectDesplegable();
    renderizarTablasKPIs();

    inputNombre.value = ''; inputLugar.value = ''; inputEdad.value = '';

    try {
        await useCase.registrarPaciente(datosPaciente, esOnline);
        if (esOnline) {
            mostrarAlertaInformativa(`✅ Paciente "${datosPaciente.nombre}" guardado con éxito en el Padrón Central.`, "success");
            await inicializarFlujoDatos();
        } else {
            mostrarAlertaInformativa(`🟠 Registrado localmente en caché offline del navegador.`, "warning");
        }
    } catch (error) {
        console.error(error);
        mostrarAlertaInformativa(error.message || "❌ Error de API Supabase.", "error");
    }
}

async function procesarGuardadoTriaje(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }

    const selectPacientes = document.getElementById('select-pacientes');
    if (!selectPacientes) return;

    const pacienteSeleccionado = selectPacientes.value;
    if (!pacienteSeleccionado || pacienteSeleccionado === "") {
        mostrarAlertaInformativa("⚠️ Seleccione un paciente válido de la lista desplegable.", "warning");
        return;
    }

    const pacienteBase = padronPacientes.find(p => p.nombre === pacienteSeleccionado);
    if (!pacienteBase) return;

    const peso = parseFloat(document.getElementById('triaje-peso').value);
    const talla = parseInt(document.getElementById('triaje-talla').value, 10);
    const fc = parseInt(document.getElementById('triaje-fc').value, 10);
    const temp = parseFloat(document.getElementById('triaje-temp').value);

    if (isNaN(peso) || isNaN(talla) || isNaN(fc) || isNaN(temp)) {
        mostrarAlertaInformativa("❌ Complete los datos médicos biométricos.", "error");
        return;
    }

    const datosTriaje = {
        paciente_nombre: pacienteBase.nombre,
        sexo: pacienteBase.sexo,
        edad: pacienteBase.edad,
        comunidad: pacienteBase.comunidad,
        peso, talla, fc, temp
    };

    const triajeVisual = new Triage(datosTriaje);
    historialTriajes.unshift(triajeVisual);
    renderizarTablasKPIs();

    selectPacientes.value = "";
    document.getElementById('triaje-peso').value = "65.0";
    document.getElementById('triaje-talla').value = "160";
    document.getElementById('triaje-fc').value = "75";
    document.getElementById('triaje-temp').value = "36.5";

    try {
        await useCase.registrarTriaje(datosTriaje, esOnline);
        if (esOnline) {
            mostrarAlertaInformativa(`✅ Ficha Clínica de "${pacienteBase.nombre}" guardada con éxito en la Nube.`, "success");
            await inicializarFlujoDatos();
        } else {
            mostrarAlertaInformativa(`🟠 Ficha de "${pacienteBase.nombre}" guardada localmente en la cola offline.`, "warning");
        }
    } catch (err) {
        console.error(err);
        mostrarAlertaInformativa("❌ Error de API Supabase / Red al subir ficha.", "error");
    }
}

function reconstruirSelectDesplegable() {
    const selectPacientes = document.getElementById('select-pacientes');
    if (!selectPacientes) return;

    selectPacientes.innerHTML = '<option value="" disabled selected>Seleccionar Paciente Habilitado</option>';

    if (padronPacientes.length === 0) {
        selectPacientes.innerHTML = '<option value="" disabled selected>⚠️ Padrón vacío o cargando...</option>';
        return;
    }

    padronPacientes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.nombre;
        opt.textContent = `${p.nombre} (${p.comunidad} - ${p.edad} años)`;
        selectPacientes.appendChild(opt);
    });
}

function renderizarTablasKPIs() {
    const tablaPacientesBody = document.getElementById('tabla-pacientes-body');
    const tablaTriajesBody = document.getElementById('tabla-triajes-body');
    const totalPacientesReg = document.getElementById('total-pacientes-reg');
    const totalTriajesRealizados = document.getElementById('total-triajes-realizados');
    const alertasCriticasEmitidas = document.getElementById('alertas-criticas-emitidas');

    if (!tablaPacientesBody || !tablaTriajesBody) return;

    tablaPacientesBody.innerHTML = '';
    padronPacientes.forEach(p => {
        const fila = `<tr><td><strong>${p.nombre}</strong></td><td>${p.comunidad}</td><td>${p.sexo}</td><td>${p.edad} años</td></tr>`;
        tablaPacientesBody.insertAdjacentHTML('beforeend', fila);
    });

    tablaTriajesBody.innerHTML = '';
    let contadorAlertasRed = 0;

    historialTriajes.forEach(t => {
        let estiloRiesgoCss = 'estado-normal';
        if (t.riesgo.includes('Crítico')) { estiloRiesgoCss = 'estado-critico'; contadorAlertasRed++; }
        else if (t.riesgo.includes('Moderado')) { estiloRiesgoCss = 'estado-moderado'; }

        const fila = `<tr>
            <td>${t.paciente_nombre}</td><td>${t.peso} kg / ${t.talla} cm</td>
            <td><strong>${t.imc}</strong> (<small>${t.estado_imc}</small>)</td>
            <td>${t.fc} lpm</td><td>${t.temp} °C</td><td class="${estiloRiesgoCss}"><strong>${t.riesgo}</strong></td>
        </tr>`;
        tablaTriajesBody.insertAdjacentHTML('beforeend', fila);
    });

    if (totalPacientesReg) totalPacientesReg.textContent = padronPacientes.length;
    if (totalTriajesRealizados) totalTriajesRealizados.textContent = historialTriajes.length;
    if (alertasCriticasEmitidas) alertasCriticasEmitidas.textContent = contadorAlertasRed;
}

function mostrarAlertaInformativa(msg, layout) {
    const banner = document.getElementById('notificacion-flotante');
    if (!banner) return;

    banner.textContent = msg;
    banner.className = `notif-base notif-${layout}`;
    banner.style.display = 'block';

    setTimeout(() => {
        banner.style.display = 'none';
    }, 4500);
}