import { Patient } from '../models/Patient.js';
import { Triage } from '../models/Triage.js';

export class HealthCenterUseCase {
  constructor(patientRepository, triageRepository) {
    this.patientRepo = patientRepository;
    this.triageRepo = triageRepository;
  }

  async inicializarFlujoDatos(esOnline) {
    if (esOnline) {
      const [pacientes, triajes] = await Promise.all([
        this.patientRepo.obtenerDesdeServidorCentral(),
        this.triageRepo.obtenerDesdeServidorCentral()
      ]);
      return { pacientes, triajes };
    } else {
      const pacientes = await this.patientRepo.obtenerDesdeCacheLocal();
      const triajes = await this.triageRepo.obtenerDesdeCacheLocal();
      return { pacientes, triajes };
    }
  }

  async registrarPaciente(datosPaciente, esOnline) {
    const paciente = new Patient(datosPaciente);
    if (!paciente.isValid()) {
      throw new Error("❌ Validación: Complete todos los campos del paciente.");
    }

    if (esOnline) {
      await this.patientRepo.guardarEnServidorCentral(paciente);
    } else {
      await this.patientRepo.guardarEnCacheLocal(paciente);
    }
    return paciente;
  }

  async registrarTriaje(datosTriaje, esOnline) {
    const triage = new Triage(datosTriaje);

    if (esOnline) {
      await this.triageRepo.guardarEnServidorCentral(triage);
    } else {
      await this.triageRepo.guardarEnCacheLocal(triage);
    }
    return triage;
  }

  async sincronizarDatosRetenidos() {
    const pacientesLocales = await this.patientRepo.obtenerDesdeCacheLocal();
    const triajesLocales = await this.triageRepo.obtenerDesdeCacheLocal();

    for (const p of pacientesLocales) {
      try { await this.patientRepo.guardarEnServidorCentral(p); } catch (e) { }
    }
    for (const t of triajesLocales) {
      try { await this.triageRepo.guardarEnServidorCentral(t); } catch (e) { }
    }

    await this.patientRepo.limpiarCacheLocal();
    await this.triageRepo.limpiarCacheLocal();
  }
}