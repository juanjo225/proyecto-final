import type { Cita } from "../types/Cita";

export type Turno = { fecha: string; hora: string };

function fechaLocal(fecha: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!partes) return null;
  const [, anio, mes, dia] = partes;
  const valor = new Date(Number(anio), Number(mes) - 1, Number(dia), 12);
  if (valor.getFullYear() !== Number(anio) || valor.getMonth() !== Number(mes) - 1 || valor.getDate() !== Number(dia)) return null;
  return valor;
}

function claveFecha(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function horaTexto(minutos: number): string {
  const hora = String(Math.floor(minutos / 60)).padStart(2, "0");
  const minuto = String(minutos % 60).padStart(2, "0");
  return `${hora}:${minuto}`;
}

export function horaFormato12(hora24: string): string {
  const minutos = minutosDeHora(hora24);
  if (minutos === null) return hora24;
  const horas = Math.floor(minutos / 60);
  const sufijo = horas < 12 ? "a. m." : "p. m.";
  return `${horas % 12 || 12}:${String(minutos % 60).padStart(2, "0")} ${sufijo}`;
}

export function obtenerTurnosDelDia(fecha: string): Turno[] {
  const dia = fechaLocal(fecha);
  if (!dia || dia.getDay() === 0) return [];

  const turnos: Turno[] = [];
  const intervalos = [[9 * 60, 13 * 60], [14 * 60, 21 * 60]];
  for (const [inicio, fin] of intervalos) {
    for (let hora = inicio; hora + 40 <= fin; hora += 40) {
      turnos.push({ fecha, hora: horaTexto(hora) });
    }
  }
  return turnos;
}

export function buscarSiguienteTurno(
  fecha: string,
  minutosSolicitados: number,
  citas: Cita[],
): Turno | null {
  const fechaElegida = fechaLocal(fecha);
  if (!fechaElegida) return null;
  const hoy = new Date();
  const fechaHoy = claveFecha(hoy);
  const minutosAhora = hoy.getHours() * 60 + hoy.getMinutes();

  for (let desplazamiento = 0; desplazamiento < 14; desplazamiento += 1) {
    const dia = new Date(fechaElegida);
    dia.setDate(fechaElegida.getDate() + desplazamiento);
    const clave = claveFecha(dia);
    const turnos = obtenerTurnosDelDia(clave);

    for (const turno of turnos) {
      const [hora, minuto] = turno.hora.split(":").map(Number);
      const minutosTurno = hora * 60 + minuto;
      if (desplazamiento === 0 && minutosTurno < minutosSolicitados) continue;
      if (turno.fecha === fechaHoy && minutosTurno < minutosAhora) continue;
      const ocupado = citas.some((cita) => cita.fechaCita.slice(0, 16) === `${turno.fecha}T${turno.hora}`);
      if (!ocupado) return turno;
    }
  }

  return null;
}

export function fechaEsValidaYFutura(fecha: string): boolean {
  const valor = fechaLocal(fecha);
  if (!valor || valor.getDay() === 0) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  valor.setHours(0, 0, 0, 0);
  return valor >= hoy;
}

export function minutosDeHora(hora: string): number | null {
  const partes = /^(\d{1,2}):(\d{2})(?:\s*([ap])\.?\s*m\.?)?$/i.exec(hora.trim());
  if (!partes) return null;
  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);
  const periodo = partes[3]?.toLocaleLowerCase();
  if (minutos > 59 || (periodo && (horas < 1 || horas > 12)) || (!periodo && horas > 23)) return null;
  const hora24 = periodo ? (horas % 12) + (periodo === "p" ? 12 : 0) : horas;
  return hora24 * 60 + minutos;
}
