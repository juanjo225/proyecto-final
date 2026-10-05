import { useState, type FormEvent } from "react";
import { buscarSiguienteTurno, fechaEsValidaYFutura, minutosDeHora, obtenerTurnosDelDia, type Turno } from "../services/horarios";
import type { Cita } from "../types/Cita";
import type { Servicio } from "../types/Servicio";

type Mensaje = { id: number; autor: "cliente" | "asistente"; texto: string };
type PasoAgenda = "libre" | "nombre" | "servicio" | "fecha" | "hora" | "confirmacion";
type Props = { servicios: Servicio[]; citas: Cita[]; onCrearCita: (cita: Cita) => void };

export function ChatSimulador({ servicios, citas, onCrearCita }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: 1, autor: "asistente", texto: "¡Hola! Soy el asistente de la barbería. Pregúntame por los servicios o escribe “agendar cita” para reservar un turno." },
  ]);
  const [texto, setTexto] = useState("");
  const [paso, setPaso] = useState<PasoAgenda>("libre");
  const [nombreCliente, setNombreCliente] = useState("");
  const [servicioElegido, setServicioElegido] = useState<Servicio | null>(null);
  const [fechaElegida, setFechaElegida] = useState("");
  const [turnoPropuesto, setTurnoPropuesto] = useState<Turno | null>(null);

  function confirmarTurno(turno: Turno, servicio: Servicio): string {
    const nuevaCita: Cita = {
      id: `local-${crypto.randomUUID()}`,
      nombreCliente,
      servicioId: servicio.id,
      nombreServicio: servicio.nombre,
      fechaCita: `${turno.fecha}T${turno.hora}:00`,
      estado: "pendiente",
      asistencia: "sin_registrar",
    };
    onCrearCita(nuevaCita);
    setPaso("libre");
    setNombreCliente("");
    setServicioElegido(null);
    setFechaElegida("");
    setTurnoPropuesto(null);
    return `Listo, ${nombreCliente}. Tu cita de ${servicio.nombre} quedó para el ${turno.fecha} a las ${turno.hora}. Está pendiente de confirmación.`;
  }

  function responder(mensaje: string): string {
    const consulta = mensaje.trim().toLocaleLowerCase("es");

    if (paso === "nombre") {
      setNombreCliente(mensaje.trim());
      setPaso("servicio");
      return `Gracias, ${mensaje.trim()}. ¿Qué servicio quieres? ${servicios.map((servicio) => servicio.nombre).join(", ")}.`;
    }

    if (paso === "servicio") {
      const seleccionado = servicios.find((servicio) => consulta.includes(servicio.nombre.toLocaleLowerCase("es")));
      if (!seleccionado) return `No encontré ese servicio. Elige uno de estos: ${servicios.map((servicio) => servicio.nombre).join(", ")}.`;
      setServicioElegido(seleccionado);
      setPaso("fecha");
      return `Elegiste ${seleccionado.nombre} (${seleccionado.duracionMinutos} minutos, $${seleccionado.precio.toLocaleString("es-CO")}). ¿Para qué fecha deseas el turno? Escribe AAAA-MM-DD. Atendemos de lunes a sábado.`;
    }

    if (paso === "fecha") {
      if (!fechaEsValidaYFutura(mensaje.trim())) {
        return "Esa fecha no está disponible. Indica una fecha futura de lunes a sábado con formato AAAA-MM-DD.";
      }
      setFechaElegida(mensaje.trim());
      setPaso("hora");
      return "¿A qué hora deseas el turno? Los horarios son de 09:00 a 13:00 y de 14:00 a 21:00. Los turnos comienzan cada 40 minutos. Escribe HH:MM, por ejemplo 09:00.";
    }

    if (paso === "hora") {
      const minutosSolicitados = minutosDeHora(mensaje);
      if (minutosSolicitados === null) return "No reconocí la hora. Escríbela en formato de 24 horas, por ejemplo 09:00 o 14:40.";
      const horaNormalizada = `${String(Math.floor(minutosSolicitados / 60)).padStart(2, "0")}:${String(minutosSolicitados % 60).padStart(2, "0")}`;
      const turno = buscarSiguienteTurno(fechaElegida, minutosSolicitados, citas);
      if (!turno) {
        setPaso("fecha");
        return "No encontré turnos disponibles en los próximos días. Indica otra fecha con formato AAAA-MM-DD.";
      }

      const horaExactaDisponible = turno.fecha === fechaElegida && turno.hora === horaNormalizada;
      if (horaExactaDisponible && obtenerTurnosDelDia(fechaElegida).some((opcion) => opcion.hora === horaNormalizada)) {
        return servicioElegido ? confirmarTurno(turno, servicioElegido) : "Perdí los datos del servicio. Escribe “agendar cita” para comenzar de nuevo.";
      }

      setTurnoPropuesto(turno);
      setPaso("confirmacion");
      return `Ese horario no está libre. El siguiente turno disponible es el ${turno.fecha} a las ${turno.hora}. ¿Deseas que lo reserve? Responde sí o no.`;
    }

    if (paso === "confirmacion") {
      if (["si", "sí", "acepto", "claro", "está bien"].some((respuesta) => consulta.includes(respuesta))) {
        return turnoPropuesto && servicioElegido
          ? confirmarTurno(turnoPropuesto, servicioElegido)
          : "No pude confirmar el turno. Escribe “agendar cita” para empezar de nuevo.";
      }
      if (["no", "otra hora"].some((respuesta) => consulta.includes(respuesta))) {
        setPaso("hora");
        return "De acuerdo. ¿A qué otra hora deseas el turno?";
      }
      return "Responde sí para reservar el horario sugerido o no para elegir otra hora.";
    }

    if (consulta.includes("cita") || consulta.includes("agendar") || consulta.includes("turno")) {
      if (servicios.length === 0) return "En este momento no tengo el catálogo disponible. Inténtalo de nuevo cuando carguen los servicios.";
      setPaso("nombre");
      return "Claro. ¿Cuál es tu nombre?";
    }

    if (consulta.includes("servicio") || consulta.includes("precio") || consulta.includes("corte")) {
      if (servicios.length === 0) return "El catálogo de servicios todavía está cargando.";
      return `Estos son nuestros servicios: ${servicios.map((servicio) => `${servicio.nombre} (${servicio.duracionMinutos} min, $${servicio.precio.toLocaleString("es-CO")})`).join("; ")}. Para reservar, escribe “agendar cita”.`;
    }

    if (consulta.includes("hola") || consulta.includes("buenos")) {
      return "¡Hola! Puedo contarte los servicios o ayudarte a agendar una cita. ¿Qué necesitas?";
    }

    return "Puedo mostrarte los servicios o ayudarte a agendar una cita. Escribe “servicios” o “agendar cita”.";
  }

  function enviarMensaje(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const mensajeCliente = texto.trim();
    if (!mensajeCliente) return;
    const respuesta = responder(mensajeCliente);
    setMensajes((actuales) => [
      ...actuales,
      { id: Date.now(), autor: "cliente", texto: mensajeCliente },
      { id: Date.now() + 1, autor: "asistente", texto: respuesta },
    ]);
    setTexto("");
  }

  return (
    <section className="panel chat-panel" id="simulador">
      <div className="panel-heading"><div><h2>Prueba el asistente virtual</h2><p>Simulación académica: consulta servicios y agenda según horarios disponibles.</p></div><span className="chat-demo-badge">DEMO</span></div>
      <div className="chat-messages" aria-live="polite" aria-label="Conversación de demostración">
        {mensajes.map((mensaje) => <p className={`chat-message ${mensaje.autor === "cliente" ? "chat-customer" : "chat-assistant"}`} key={mensaje.id}><span>{mensaje.texto}</span><small>{mensaje.autor === "cliente" ? "Cliente" : "Asistente"}</small></p>)}
      </div>
      <form className="chat-input-row" onSubmit={enviarMensaje}>
        <label className="sr-only" htmlFor="mensaje-simulador">Escribe un mensaje para el asistente</label>
        <input id="mensaje-simulador" value={texto} onChange={(evento) => setTexto(evento.target.value)} placeholder="Escribe “servicios” o “agendar cita”…" />
        <button className="primary-button" type="submit" disabled={!texto.trim()}>Enviar</button>
      </form>
      <p className="chat-disclaimer">Este chat no está conectado a WhatsApp. La agenda usa bloques fijos de 40 minutos; la duración del catálogo es informativa.</p>
    </section>
  );
}
