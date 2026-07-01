import { PatientRepositoryPort } from '../../ports/PatientRepositoryPort.js';
import { TriageRepositoryPort } from '../../ports/TriageRepositoryPort.js';
import { Patient } from '../../domain/models/Patient.js';
import { Triage } from '../../domain/models/Triage.js';

export class SupabaseStorageAdapter extends (PatientRepositoryPort, TriageRepositoryPort) {
  constructor() {
    super();
    this.SUPABASE_URL = "https://pmgijuomphjkaejdwfaz.supabase.co";
    this.SUPABASE_KEY = "sb_publishable_HKm9C7nXWHEZSoLLnCmXfw_0C5n29H8";
    this.HEADERS = {
      "apikey": this.SUPABASE_KEY,
      "Authorization": `Bearer ${this.SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    };
  }

  async obtenerDesdeServidorCentral() {
    const res = await fetch(`${this.SUPABASE_URL}/rest/v1/pacientes?order=id.desc`, { headers: this.HEADERS });
    if (!res.ok) throw new Error("Error cargando pacientes");
    const data = await res.json();
    return data.map(p => new Patient(p));
  }

  async obtenerDesdeCacheLocal() {
    const locales = JSON.parse(localStorage.getItem('pacientes_locales')) || [];
    return locales.map(p => new Patient(p));
  }

  async guardarEnServidorCentral(patient) {
    const payload = { nombre: patient.nombre, comunidad: patient.comunidad, sexo: patient.sexo, edad: patient.edad };
    const res = await fetch(`${this.SUPABASE_URL}/rest/v1/pacientes`, {
      method: "POST",
      headers: this.HEADERS,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Error de API Supabase Pacientes RLS");
    return res;
  }

  async guardarEnCacheLocal(patient) {
    let locales = JSON.parse(localStorage.getItem('pacientes_locales')) || [];
    locales.unshift({ nombre: patient.nombre, comunidad: patient.comunidad, sexo: patient.sexo, edad: patient.edad });
    localStorage.setItem('pacientes_locales', JSON.stringify(locales));
  }

  async limpiarCacheLocal() {
    localStorage.removeItem('pacientes_locales');
  }

  async obtenerDesdeServidorCentralTriajes() {
    const res = await fetch(`${this.SUPABASE_URL}/rest/v1/triajes?order=id.desc`, { headers: this.HEADERS });
    if (!res.ok) throw new Error("Error cargando triajes");
    const data = await res.json();
    return data.map(t => new Triage(t));
  }

  async obtenerDesdeCacheLocalTriajes() {
    const locales = JSON.parse(localStorage.getItem('triajes_locales')) || [];
    return locales.map(t => new Triage(t));
  }

  async guardarEnServidorCentralTriaje(triage) {
    const res = await fetch(`${this.SUPABASE_URL}/rest/v1/triajes`, {
      method: "POST",
      headers: this.HEADERS,
      body: JSON.stringify(triage)
    });
    if (!res.ok) throw new Error("Error de API Supabase Triajes RLS");
    return res;
  }

  async guardarEnCacheLocalTriaje(triage) {
    let locales = JSON.parse(localStorage.getItem('triajes_locales')) || [];
    locales.unshift(triage);
    localStorage.setItem('triajes_locales', JSON.stringify(locales));
  }

  async limpiarCacheLocalTriajes() {
    localStorage.removeItem('triajes_locales');
  }
}