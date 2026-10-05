import { useState, type FormEvent } from "react";
import type { Cita } from "../types/Cita";
import type { Servicio } from "../types/Servicio";
import { buscarSiguienteTurno, fechaEsValidaYFutura, minutosDeHora, obtenerTurnosDelDia } from "../services/horarios";

type Props = { servicios: Servicio[]; citas: Cita[]; onCrear: (cita: Cita) => void };

export function FormularioCita({ servicios, citas, onCrear }: Props) {
  const [nombreCliente, setNombreCliente] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [fechaCita, setFechaCita] = useState("");
  const [error, setError] = useState("");

  function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const servicio = servicios.find((elemento) => elemento.id === Number(servicioId));
    if (!nombreCliente.trim() || !servicio || !fechaCita) {
      setError("Completa el nombre, el servicio y la fecha de la cita.");
      return;
    }

    const fecha = fechaCita.slice(0, 10);
    const hora = fechaCita.slice(11, 16);
    const minutos = minutosDeHora(hora);
    const turnoSiguiente = minutos === null ? null : buscarSiguienteTurno(fecha, minutos, citas);
    const esTurnoExacto = obtenerTurnosDelDia(fecha).some((turno) => turno.hora === hora);
    const estaLibre = turnoSiguiente?.fecha === fecha && turnoSiguiente.hora === hora;
    if (!fechaEsValidaYFutura(fecha) || !esTurnoExacto || !estaLibre) {
      const sugerencia = turnoSiguiente ? ` El siguiente turno disponible es ${turnoSiguiente.fecha} a las ${turnoSiguiente.hora}.` : " No se encontraron turnos cercanos.";
      setError(`Elige un turno disponible de lunes a sábado, cada 40 minutos.${sugerencia}`);
      return;
    }

    onCrear({
      id: `local-${crypto.randomUUID()}`,
      nombreCliente: nombreCliente.trim(),
      servicioId: servicio.id,
      nombreServicio: servicio.nombre,
      fechaCita,
      estado: "pendiente",
      asistencia: "sin_registrar",
    });
    setNombreCliente("");
    setServicioId("");
    setFechaCita("");
    setError("");
  }

  return (
    <form className="conversation-form" onSubmit={manejarEnvio}>
      <label>Nombre del cliente<input value={nombreCliente} onChange={(evento) => setNombreCliente(evento.target.value)} placeholder="Ej. Ana Gómez" /></label>
      <label>Servicio<select value={servicioId} onChange={(evento) => setServicioId(evento.target.value)}><option value="">Selecciona un servicio</option>{servicios.map((servicio) => <option key={servicio.id} value={servicio.id}>{servicio.nombre} · ${servicio.precio.toLocaleString("es-CO")}</option>)}</select></label>
      <label>Fecha y hora<input type="datetime-local" value={fechaCita} onChange={(evento) => setFechaCita(evento.target.value)} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" type="submit" disabled={servicios.length === 0}><span aria-hidden="true">＋</span> Agendar cita</button>
    </form>
  );
}
