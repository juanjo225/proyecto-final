import { useState } from "react";
import type { Cita, EstadoAsistencia } from "../types/Cita";
import { horaFormato12 } from "../services/horarios";

type Props = {
  citas: Cita[];
  onCambiarEstado: (id: string) => void;
  onCambiarAsistencia: (id: string, asistencia: EstadoAsistencia) => void;
  onCancelar: (id: string) => void;
};

function claveFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function obtenerDiasSemana(desplazamiento: number): Date[] {
  const lunes = new Date();
  lunes.setHours(0, 0, 0, 0);
  const diasHastaLunes = (8 - lunes.getDay()) % 7;
  lunes.setDate(lunes.getDate() + diasHastaLunes + desplazamiento * 7);
  return Array.from({ length: 6 }, (_, indice) => {
    const dia = new Date(lunes);
    dia.setDate(lunes.getDate() + indice);
    return dia;
  });
}

function mostrarHora(fecha: string): string {
  return horaFormato12(fecha.slice(11, 16));
}

export function AgendaSemanal({ citas, onCambiarEstado, onCambiarAsistencia, onCancelar }: Props) {
  const [desplazamientoSemana, setDesplazamientoSemana] = useState(0);
  const dias = obtenerDiasSemana(desplazamientoSemana);
  const [diaElegido, setDiaElegido] = useState(claveFecha(dias[0]));
  const diaActual = dias.some((dia) => claveFecha(dia) === diaElegido) ? diaElegido : claveFecha(dias[0]);
  const citasDelDia = citas
    .filter((cita) => claveFecha(new Date(cita.fechaCita)) === diaActual)
    .sort((a, b) => new Date(a.fechaCita).getTime() - new Date(b.fechaCita).getTime());

  const comienzoSemana = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(dias[0]);
  const finSemana = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(dias[5]);

  function cambiarSemana(cambio: number) {
    setDesplazamientoSemana((actual) => actual + cambio);
    const nuevaSemana = obtenerDiasSemana(desplazamientoSemana + cambio);
    setDiaElegido(claveFecha(nuevaSemana[0]));
  }

  return (
    <div className="calendar-view">
      <div className="calendar-toolbar">
        <div><h3>Agenda semanal</h3><p>{comienzoSemana} – {finSemana}</p></div>
        <div className="calendar-navigation"><button type="button" aria-label="Semana anterior" onClick={() => cambiarSemana(-1)}>‹</button><button type="button" aria-label="Semana siguiente" onClick={() => cambiarSemana(1)}>›</button></div>
      </div>
      <div className="calendar-days" role="tablist" aria-label="Días de la semana">
        {dias.map((dia) => {
          const clave = claveFecha(dia);
          const cantidad = citas.filter((cita) => claveFecha(new Date(cita.fechaCita)) === clave).length;
          return <button className={`calendar-day ${diaActual === clave ? "calendar-day-selected" : ""}`} type="button" role="tab" aria-selected={diaActual === clave} key={clave} onClick={() => setDiaElegido(clave)}><span>{new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(dia).replace(".", "")}</span><strong>{dia.getDate()}</strong><small>{cantidad ? `${cantidad} ${cantidad === 1 ? "cita" : "citas"}` : "—"}</small></button>;
        })}
      </div>
      <div className="calendar-events" role="tabpanel">
        <h4>{new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${diaActual}T12:00:00`))}</h4>
        {citasDelDia.length === 0 && <p className="calendar-empty">No tienes citas para este día.</p>}
        {citasDelDia.map((cita) => <article className="calendar-event" key={cita.id}>
          <div className="event-time"><strong>{mostrarHora(cita.fechaCita)}</strong><span className="event-time-line" /></div>
          <div className={`event-card ${cita.estado === "confirmada" ? "event-confirmed" : ""}`}>
            <div className="event-title-row"><strong>{cita.nombreCliente}</strong><span className={`status-pill ${cita.estado === "confirmada" ? "status-done" : "status-pending"}`}>{cita.estado === "confirmada" ? "Confirmada" : "Pendiente"}</span></div>
            <p>{cita.nombreServicio}</p>
            <p className={`attendance-label attendance-${cita.asistencia}`}>Asistencia: {cita.asistencia === "asistio" ? "Asistió" : cita.asistencia === "no_asistio" ? "No asistió" : "Sin registrar"}</p>
            <div className="attendance-actions" aria-label={`Registrar asistencia de ${cita.nombreCliente}`}>
              <button className={`attendance-button present-button ${cita.asistencia === "asistio" ? "attendance-selected" : ""}`} type="button" aria-pressed={cita.asistencia === "asistio"} onClick={() => onCambiarAsistencia(cita.id, "asistio")}>Asistió</button>
              <button className={`attendance-button absent-button ${cita.asistencia === "no_asistio" ? "attendance-selected" : ""}`} type="button" aria-pressed={cita.asistencia === "no_asistio"} onClick={() => onCambiarAsistencia(cita.id, "no_asistio")}>No asistió</button>
            </div>
            <div className="event-actions"><button className="text-button" type="button" onClick={() => onCambiarEstado(cita.id)}>{cita.estado === "confirmada" ? "Marcar pendiente" : "Confirmar"}</button><button className="cancel-button" type="button" onClick={() => { if (window.confirm(`¿Cancelar la cita de ${cita.nombreCliente}?`)) onCancelar(cita.id); }}>Cancelar cita</button></div>
          </div>
        </article>)}
      </div>
    </div>
  );
}
