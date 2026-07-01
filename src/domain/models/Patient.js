export class Patient {
  constructor({ nombre, comunidad, sexo, edad, id = null }) {
    this.id = id;
    this.nombre = nombre;
    this.comunidad = comunidad;
    this.sexo = sexo;
    this.edad = parseInt(edad, 10);
  }

  isValid() {
    return this.nombre && this.nombre.trim() !== "" &&
      this.comunidad && this.comunidad.trim() !== "" &&
      !isNaN(this.edad);
  }
}