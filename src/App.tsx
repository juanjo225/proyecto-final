import { useEffect, useState } from "react";
import { Buscador } from "./components/Buscador";
import { AgendaSemanal } from "./components/AgendaSemanal";
import { ChatSimulador } from "./components/ChatSimulador";
import { FormularioCita } from "./components/FormularioCita";
import { Resumen } from "./components/Resumen";
import { obtenerServicios } from "./services/serviciosApi";
import type { Cita, EstadoAsistencia, EstadoCita } from "./types/Cita";
import type { Servicio } from "./types/Servicio";
import "./App.css";

type CambiosLocales = {
  citasCreadas: Cita[];
  estadosModificados: Record<string, EstadoCita>;
  asistenciasModificadas: Record<string, EstadoAsistencia>;
  citasCanceladas: string[];
};
const CLAVE_LOCAL = "asistente-virtual-citas";

function leerCambiosLocales(): CambiosLocales {
  try {
    const guardado = localStorage.getItem(CLAVE_LOCAL);
    if (!guardado) return { citasCreadas: [], estadosModificados: {}, asistenciasModificadas: {}, citasCanceladas: [] };
    const datos: unknown = JSON.parse(guardado);
    if (typeof datos !== "object" || datos === null) throw new Error("Formato local inválido");
    const cambios = datos as Partial<CambiosLocales>;
    return {
      citasCreadas: Array.isArray(cambios.citasCreadas) ? cambios.citasCreadas : [],
      estadosModificados: cambios.estadosModificados ?? {},
      asistenciasModificadas: cambios.asistenciasModificadas ?? {},
      citasCanceladas: Array.isArray(cambios.citasCanceladas) ? cambios.citasCanceladas : [],
    };
  } catch {
    return { citasCreadas: [], estadosModificados: {}, asistenciasModificadas: {}, citasCanceladas: [] };
  }
}

async function obtenerCitasDeDemostracion(): Promise<Cita[]> {
  const respuesta = await fetch("/citas-demo.json");
  if (!respuesta.ok) throw new Error("No se pudieron cargar las citas de demostración.");
  const datos: unknown = await respuesta.json();
  if (!Array.isArray(datos)) throw new Error("El archivo de demostración debe contener una lista de citas.");
  return datos as Cita[];
}

function App() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cambiosLocales, setCambiosLocales] = useState<CambiosLocales>(leerCambiosLocales);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    Promise.all([obtenerServicios(), obtenerCitasDeDemostracion()])
      .then(([serviciosApi, citasDemo]) => {
        if (cancelado) return;
        const cambios = leerCambiosLocales();
        const citasIniciales = citasDemo.filter((cita) => !cambios.citasCanceladas.includes(cita.id)).map((cita) => ({
          ...cita,
          estado: cambios.estadosModificados[cita.id] ?? cita.estado,
          asistencia: cambios.asistenciasModificadas[cita.id] ?? cita.asistencia ?? "sin_registrar",
        }));
        setServicios(serviciosApi);
        const citasGuardadas = cambios.citasCreadas.map((cita) => ({ ...cita, asistencia: cambios.asistenciasModificadas[cita.id] ?? cita.asistencia ?? "sin_registrar" }));
        setCitas([...citasGuardadas, ...citasIniciales].filter((cita) => !cambios.citasCanceladas.includes(cita.id)));
        setCambiosLocales(cambios);
        setCargando(false);
      })
      .catch((errorCarga: unknown) => {
        if (cancelado) return;
        setError(errorCarga instanceof Error ? errorCarga.message : "Ocurrió un error al cargar la información.");
        setCargando(false);
      });
    return () => { cancelado = true; };
  }, [intento]);

  useEffect(() => {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify(cambiosLocales));
  }, [cambiosLocales]);

  function cambiarEstado(id: string) {
    const cita = citas.find((elemento) => elemento.id === id);
    if (!cita) return;
    const nuevoEstado: EstadoCita = cita.estado === "pendiente" ? "confirmada" : "pendiente";
    setCitas((actuales) => actuales.map((elemento) => elemento.id === id ? { ...elemento, estado: nuevoEstado } : elemento));
    setCambiosLocales((actuales) => ({
      ...actuales,
      estadosModificados: { ...actuales.estadosModificados, [id]: nuevoEstado },
    }));
  }

  function registrarAsistencia(id: string, asistencia: EstadoAsistencia) {
    setCitas((actuales) => actuales.map((cita) => cita.id === id ? { ...cita, asistencia } : cita));
    setCambiosLocales((actuales) => ({
      ...actuales,
      asistenciasModificadas: { ...actuales.asistenciasModificadas, [id]: asistencia },
    }));
  }

  function crearCita(nueva: Cita) {
    setCitas((actuales) => [nueva, ...actuales]);
    setCambiosLocales((actuales) => ({ ...actuales, citasCreadas: [nueva, ...actuales.citasCreadas] }));
  }

  function cancelarCita(id: string) {
    setCitas((actuales) => actuales.filter((cita) => cita.id !== id));
    setCambiosLocales((actuales) => ({
      ...actuales,
      citasCanceladas: [...new Set([...actuales.citasCanceladas, id])],
    }));
  }

  const textoBusqueda = busqueda.trim().toLocaleLowerCase("es");
  const citasVisibles = citas.filter((cita) => {
    const coincideTexto = `${cita.nombreCliente} ${cita.nombreServicio}`.toLocaleLowerCase("es").includes(textoBusqueda);
    const coincideEstado = filtroEstado === "todos" || cita.estado === filtroEstado;
    return coincideTexto && coincideEstado;
  });
  const pendientes = citas.filter((cita) => cita.estado === "pendiente").length;
  const asistieron = citas.filter((cita) => cita.asistencia === "asistio").length;
  const noAsistieron = citas.filter((cita) => cita.asistencia === "no_asistio").length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" aria-label="Asistente Virtual, inicio"><span className="brand-mark">✦</span><span>asistente<span className="brand-light">.virtual</span></span></a>
        <p className="nav-label">MENÚ PRINCIPAL</p>
        <nav aria-label="Navegación principal">
          <a className="nav-item active" href="#inicio"><span>▦</span> Resumen</a>
          <a className="nav-item" href="#agenda"><span>▤</span> Agenda de citas</a>
          <a className="nav-item" href="#simulador"><span>◉</span> Asistente virtual</a>
          <a className="nav-item" href="#nueva-cita"><span>＋</span> Agendar cita</a>
        </nav>
        <div className="sidebar-note"><span className="note-icon">✦</span><strong>Tu agenda, organizada</strong><p>Consulta los turnos de clientes y los servicios disponibles.</p></div>
        <div className="profile"><span className="profile-avatar">AV</span><span><strong>Mi espacio</strong><small>Panel de barbería</small></span><span className="profile-dots">•••</span></div>
      </aside>

      <main className="main-content" id="inicio">
        <header className="topbar"><div className="breadcrumb">Inicio <span>/</span> <strong>Agenda</strong></div><div className="topbar-actions"><span className="today-label">Panel de atención</span><span className="topbar-avatar">AV</span></div></header>
        <div className="page-content">
          <section className="welcome-row"><div><p className="eyebrow">AGENDA DE BARBERÍA</p><h1>Hola, bienvenido <span>✦</span></h1><p className="page-subtitle">Organiza las citas de tus clientes y ten a mano tus servicios.</p></div><a className="primary-button welcome-action" href="#nueva-cita"><span>＋</span> Nueva cita</a></section>

          <Resumen total={citas.length} pendientes={pendientes} asistieron={asistieron} noAsistieron={noAsistieron} />

          <ChatSimulador servicios={servicios} citas={citas} onCrearCita={crearCita} />

          <div className="content-columns">
            <section className="panel conversation-panel" id="agenda">
              <div className="panel-heading"><div><h2>Agenda de citas</h2><p>Busca clientes y revisa el estado de sus turnos.</p></div><span className="count-badge">{citas.length}</span></div>
              <Buscador busqueda={busqueda} estado={filtroEstado} onBusquedaChange={setBusqueda} onEstadoChange={setFiltroEstado} />
              {cargando && <div className="feedback-state" role="status"><span className="spinner" />Cargando catálogo y agenda...</div>}
              {!cargando && error && <div className="feedback-state error-state" role="alert"><span className="feedback-symbol">!</span><h3>No pudimos cargar la información</h3><p>{error}</p><button className="secondary-button" type="button" onClick={() => { setError(""); setCargando(true); setIntento((actual) => actual + 1); }}>Volver a intentar</button></div>}
              {!cargando && !error && citas.length === 0 && <div className="feedback-state"><span className="feedback-symbol">▤</span><h3>No hay citas disponibles</h3><p>Agrega una cita desde el formulario para verla aquí.</p></div>}
              {!cargando && !error && citas.length > 0 && citasVisibles.length === 0 && <div className="feedback-state compact-state"><h3>No encontramos resultados</h3><p>Prueba con otro nombre, servicio o estado.</p></div>}
              {!cargando && !error && citasVisibles.length > 0 && <AgendaSemanal citas={citasVisibles} onCambiarEstado={cambiarEstado} onCambiarAsistencia={registrarAsistencia} onCancelar={cancelarCita} />}
              {!cargando && !error && citas.length > 0 && <p className="list-footnote">Mostrando {citasVisibles.length} de {citas.length} citas. Los ocho turnos iniciales son ejemplos locales.</p>}
            </section>

            <section className="panel form-panel" id="nueva-cita">
              <div className="panel-heading"><div><h2>Agendar una cita</h2><p>Registra al cliente, el servicio y la fecha.</p></div></div>
              {!cargando && !error && <FormularioCita servicios={servicios} citas={citas} onCrear={crearCita} />}
              <div className="privacy-note"><span>ⓘ</span><p>Las citas se guardan en este navegador. La API del docente solo proporciona el catálogo de servicios.</p></div>
              <div className="service-list"><h3>Servicios de barbería</h3><p className="service-source">Cargados desde GET /api/barberia</p>
                {servicios.length === 0 && !cargando && !error && <p className="empty-services">La API no devolvió servicios.</p>}
                {servicios.map((servicio) => <article className="service-row" key={servicio.id}><span className="service-symbol">✂</span><span className="service-detail"><strong>{servicio.nombre}</strong><small>{servicio.duracionMinutos} min</small></span><strong className="service-price">${servicio.precio.toLocaleString("es-CO")}</strong></article>)}
              </div>
            </section>
          </div>
          <footer className="page-footer"><span>Asistente Virtual <span className="footer-dot">•</span> Proyecto académico</span><span>3 servicios de la API · 8 citas locales de demostración</span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
