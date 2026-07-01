export class Triage {
  constructor({ paciente_nombre, sexo, edad, comunidad, peso, talla, fc, temp, imc = null, estado_imc = null, riesgo = null }) {
    this.paciente_nombre = paciente_nombre;
    this.sexo = sexo;
    this.edad = parseInt(edad, 10);
    this.comunidad = comunidad;
    this.peso = parseFloat(peso);
    this.talla = parseInt(talla, 10);
    this.fc = parseInt(fc, 10);
    this.temp = parseFloat(temp);

    this.imc = imc !== null ? parseFloat(imc) : this._calcularImc();
    this.estado_imc = estado_imc !== null ? estado_imc : this._evaluarEstadoImc();
    this.riesgo = riesgo !== null ? riesgo : this._evaluarRiesgoClínico();
  }

  _calcularImc() {
    const tallaM = this.talla / 100;
    return parseFloat((this.peso / (tallaM * tallaM)).toFixed(1));
  }

  _evaluarEstadoImc() {
    if (this.imc < 18.5) return "Bajo Peso";
    if (this.imc >= 25 && this.imc < 30) return "Sobrepeso";
    if (this.imc >= 30) return "Obesidad";
    return "Normal";
  }

  _evaluarRiesgoClínico() {
    if (this.temp >= 38.0 || this.fc > 100 || this.fc < 60) {
      return "Crítico (Alerta Roja)";
    } else if (this.estado_imc === "Obesidad" && this.edad > 60) {
      return "Riesgo Moderado (Monitoreo)";
    }
    return "Normal";
  }
}