export class PatientRepositoryPort {
  async obtenerDesdeServidorCentral() { throw new Error("Método no implementado"); }
  async obtenerDesdeCacheLocal() { throw new Error("Método no implementado"); }
  async guardarEnServidorCentral(patient) { throw new Error("Método no implementado"); }
  async guardarEnCacheLocal(patient) { throw new Error("Método no implementado"); }
  async limpiarCacheLocal() { throw new Error("Método no implementado"); }
}