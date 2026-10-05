import type { Servicio } from "../types/Servicio";

const API_URL = import.meta.env.VITE_API_URL || "https://proyecto-final-programacion-creativa-production.up.railway.app/api/barberia";

export async function obtenerServicios(): Promise<Servicio[]> {
  const respuesta = await fetch(API_URL);
  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el catálogo de servicios. Revisa la conexión e inténtalo de nuevo.");
  }

  const datos: unknown = await respuesta.json();
  if (typeof datos !== "object" || datos === null || !Array.isArray((datos as { recursos?: unknown }).recursos)) {
    throw new Error("La respuesta de la API no tiene la lista de recursos esperada.");
  }

  return (datos as { recursos: unknown[] }).recursos.map((recurso): Servicio => {
    if (typeof recurso !== "object" || recurso === null) {
      throw new Error("Uno de los servicios recibidos no tiene un formato válido.");
    }
    const elemento = recurso as Record<string, unknown>;
    if (
      typeof elemento.id !== "number" ||
      typeof elemento.servicio !== "string" ||
      typeof elemento.duracionMinutos !== "number" ||
      typeof elemento.precio !== "number"
    ) {
      throw new Error("Un servicio no coincide con el modelo esperado.");
    }
    return {
      id: elemento.id,
      nombre: elemento.servicio,
      duracionMinutos: elemento.duracionMinutos,
      precio: elemento.precio,
    };
  });
}
