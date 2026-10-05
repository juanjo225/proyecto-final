export type EstadoCita = "pendiente" | "confirmada";
export type EstadoAsistencia = "sin_registrar" | "asistio" | "no_asistio";

export type Cita = {
  id: string;
  nombreCliente: string;
  servicioId: number;
  nombreServicio: string;
  fechaCita: string;
  estado: EstadoCita;
  asistencia: EstadoAsistencia;
};
