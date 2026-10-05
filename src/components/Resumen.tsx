type Props = { total: number; pendientes: number; asistieron: number; noAsistieron: number };

export function Resumen({ total, pendientes, asistieron, noAsistieron }: Props) {
  return (
    <section className="summary-grid" aria-label="Resumen de conversaciones">
      <article className="summary-card">
        <span className="summary-icon icon-violet">▣</span>
        <div><p>Citas en agenda</p><strong>{total}</strong></div>
        <span className="summary-caption">Programadas</span>
      </article>
      <article className="summary-card">
        <span className="summary-icon icon-orange">◷</span>
        <div><p>Pendientes</p><strong>{pendientes}</strong></div>
        <span className="summary-caption">Por confirmar</span>
      </article>
      <article className="summary-card">
        <span className="summary-icon icon-green">✓</span>
        <div><p>Asistieron</p><strong>{asistieron}</strong></div>
        <span className="summary-caption">Turnos atendidos</span>
      </article>
      <article className="summary-card">
        <span className="summary-icon icon-orange">×</span>
        <div><p>No asistieron</p><strong>{noAsistieron}</strong></div>
        <span className="summary-caption">Ausencias registradas</span>
      </article>
    </section>
  );
}
