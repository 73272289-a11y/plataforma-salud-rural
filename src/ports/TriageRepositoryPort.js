export class TriageRepositoryPort {
  async obtenerDesdeServidorCentral() { throw new Error("Método no implementado"); }
  async obtenerDesdeCacheLocal() { throw new Error("Método no implementado"); }
  async guardarEnServidorCentral(triage) { throw new Error("Método no implementado"); }
  async guardarEnCacheLocal(triage) { throw new Error("Método no implementado"); }
  async limpiarCacheLocal() { throw new Error("Método no implementado"); }
}