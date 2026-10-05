type Props = {
  busqueda: string;
  estado: string;
  onBusquedaChange: (valor: string) => void;
  onEstadoChange: (valor: string) => void;
};

export function Buscador({ busqueda, estado, onBusquedaChange, onEstadoChange }: Props) {
  return (
    <div className="filters">
      <label className="search-box">
        <span aria-hidden="true">⌕</span>
        <span className="sr-only">Buscar por cliente o mensaje</span>
        <input
          type="search"
          placeholder="Buscar por cliente o servicio..."
          value={busqueda}
          onChange={(evento) => onBusquedaChange(evento.target.value)}
        />
      </label>
      <label className="filter-select">
        <span className="sr-only">Filtrar por estado</span>
        <select value={estado} onChange={(evento) => onEstadoChange(evento.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="confirmada">Confirmadas</option>
        </select>
      </label>
    </div>
  );
}
