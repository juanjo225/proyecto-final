# Asistente Virtual para Barbería

Aplicación web académica para revisar una agenda de citas y consultar los servicios de una barbería. La idea del asistente que atiende WhatsApp se representa como un prototipo: esta web no está conectada a WhatsApp ni genera citas automáticamente desde mensajes.

## Problema, usuario y objetivo

- **Problema:** a un negocio pequeño se le pueden pasar por alto solicitudes de citas o confirmaciones.
- **Persona usuaria:** una persona que atiende clientes y organiza turnos en una barbería.
- **Objetivo:** mostrar una agenda sencilla, facilitar el seguimiento de las citas y consultar el catálogo de servicios.

## Funciones

- Consulta GET del catálogo real de barbería.
- Mensaje de carga, mensaje de error con reintento y estado vacío para el catálogo.
- Agenda de ejemplo con ocho citas locales, búsqueda por cliente o servicio y filtro por estado.
- Simulador de chat con reglas sencillas para mostrar servicios y guiar una reserva paso a paso.
- Agenda semanal tipo calendario, adaptable a celular, con citas agrupadas por día y ordenadas por hora.
- Acciones para confirmar o cancelar citas; las cancelaciones se conservan tras recargar.
- Botones para registrar si cada cliente asistió o no asistió; los resultados se conservan tras recargar.
- Formulario y simulador para agendar usando un servicio del catálogo.
- Resumen calculado de citas, pendientes, asistencias y ausencias.
- Persistencia en `localStorage` de citas agregadas, estados modificados, asistencia y cancelaciones.
- Diseño adaptable a celular y computador.

## Límite importante de la API

La ruta entregada por el docente para barbería es `GET /api/barberia`. Devuelve **tres servicios**, no clientes ni citas. Por eso, el catálogo se carga desde la API y se usa en el formulario. La agenda inicial de ocho turnos está en `public/citas-demo.json` y se identifica en pantalla y en el código como datos locales de demostración; no son ocho registros obtenidos de la API.

Esta adaptación permite demostrar la búsqueda, el filtro, el formulario, las acciones, el resumen y `localStorage`, pero **no cumple literalmente** el requisito de ocho elementos iniciales provenientes de la API. Se debe explicar esta limitación al docente y preguntar si acepta la adaptación o si puede proporcionar un endpoint de citas con al menos ocho registros.

La integración real con WhatsApp queda fuera del proyecto frontend. Para recibir mensajes y crear citas automáticamente se necesitaría WhatsApp Business Platform y un backend seguro.

El simulador académico es un componente React local: interpreta frases como “servicios” y “agendar cita” usando condiciones `if`. Para agendar solicita nombre, servicio y fecha. Cuando termina, usa la misma función de creación que el formulario para añadir la cita a la agenda. No recibe ni manda mensajes a una cuenta de WhatsApp.

El asistente pregunta primero la fecha y después la hora deseada. Si esa hora no es un turno válido o ya está ocupada, busca el siguiente horario libre y pide confirmación antes de reservarlo. Los turnos se generan en intervalos fijos de 40 minutos, de lunes a sábado, con descanso de 13:00 a 14:00. El último turno comienza a las 20:00 para cerrar antes de las 21:00. La duración del servicio que muestra la API es informativa; el horario de agenda usa los 40 minutos fijos solicitados. Por ello, el turno siguiente puede comenzar antes de que termine el servicio de 45 minutos; esta es una limitación de la regla académica elegida.

## Tecnologías

React, TypeScript, Vite, HTML, CSS, `fetch` y `localStorage`. No se añadieron librerías de interfaz ni de solicitudes HTTP.

## Instalar y ejecutar

Requiere Node.js y npm.

```bash
npm install
npm run dev
```

Ejecuta esos comandos desde la carpeta `asistente-virtual`, donde se encuentra `package.json`. Vite mostrará la dirección local que se abre en el navegador.

Para validar el proyecto:

```bash
npm run build
npm run lint
```

## Estructura

```text
public/
  citas-demo.json              # ocho citas locales de demostración
src/
  components/
    Buscador.tsx
    ChatSimulador.tsx
    FormularioCita.tsx
    Resumen.tsx
    AgendaSemanal.tsx
  services/serviciosApi.ts     # GET y conversión del catálogo
  types/Cita.ts                # modelo de cita
  types/Servicio.ts            # modelo del recurso API
  App.tsx                      # carga, agenda y persistencia
```

## Modelos TypeScript

```typescript
export type Servicio = {
  id: number;
  nombre: string;
  duracionMinutos: number;
  precio: number;
};

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
```

`Servicio` representa los datos que realmente devuelve la API. `Cita` representa la agenda de ejemplo y los turnos creados desde el formulario.

## API utilizada

- Índice: `https://proyecto-final-programacion-creativa-production.up.railway.app`
- Catálogo de barbería: `https://proyecto-final-programacion-creativa-production.up.railway.app/api/barberia`
- Temáticas disponibles: `https://proyecto-final-programacion-creativa-production.up.railway.app/api/tematicas`

La ruta de barbería devuelve una estructura como esta:

```json
{
  "tematica": "Barbería",
  "cantidad": 3,
  "recursos": [
    { "id": 1, "servicio": "Corte clásico", "duracionMinutos": 30, "precio": 25000 },
    { "id": 2, "servicio": "Corte y barba", "duracionMinutos": 45, "precio": 40000 },
    { "id": 3, "servicio": "Arreglo de barba", "duracionMinutos": 20, "precio": 18000 }
  ]
}
```

En `src/services/serviciosApi.ts`, `fetch` consulta la ruta y comprueba que exista el arreglo `recursos`. Luego convierte `servicio` al nombre local `nombre` y conserva el identificador, la duración y el precio. Así los componentes trabajan con el tipo `Servicio` en vez de depender directamente de la respuesta externa.

### Cambiar la URL de la API

La ruta está configurada por defecto en `src/services/serviciosApi.ts`. Si se debe cambiar, copia `.env.example` como `.env.local`, modifica `VITE_API_URL` y reinicia Vite. Esa URL es visible en el navegador; no pongas contraseñas, tokens ni claves privadas en variables `VITE_*`.

## `localStorage`

- La API proporciona el catálogo de tres servicios.
- `public/citas-demo.json` proporciona ocho citas de muestra para la agenda académica; no es la API del docente.
- Las citas que agrega la persona usuaria, los estados cambiados, la asistencia registrada y los IDs cancelados se guardan bajo la clave `asistente-virtual-citas`.
- Al abrir la página, se recuperan esos cambios locales y se combinan con las citas de demostración. El catálogo se vuelve a pedir a la API.
- Los datos locales permanecen en ese navegador. Si se borra su almacenamiento, se pierden.

## Comprobación manual

1. La carga debe mostrar ocho citas de ejemplo y tres servicios del endpoint.
2. En el simulador, escribe `servicios` y revisa nombre, duración y precio. Luego escribe `agendar cita`, ingresa un nombre y un servicio, indica una fecha futura como `2026-10-15` y responde `09:00` cuando pregunte la hora.
3. Para probar que una hora ocupada propone la siguiente, agenda una cita para `2026-10-05` a las `09:00`; ya existe una cita de muestra a esa hora, así que el asistente debe ofrecer las `09:40`.
4. Busca un cliente o servicio y combina la búsqueda con el filtro de estado.
5. Confirma y cancela citas. La cancelación pide confirmación, quita la cita de la agenda y debe seguir oculta después de recargar.
6. En una cita de la agenda, pulsa `Asistió` o `No asistió`; verifica que el botón seleccionado quede marcado y que cambien los totales del resumen. Recarga y confirma que el registro siga igual.
7. Agrega una cita desde el formulario; verifica la validación de día, hora y disponibilidad.
8. Recarga la página y verifica que citas nuevas, estados, asistencias y cancelaciones permanezcan.
9. Para revisar el error, configura temporalmente una URL incorrecta y reinicia Vite; debe aparecer el botón de reintento.
10. Para revisar el estado vacío de citas, reemplaza temporalmente `public/citas-demo.json` por `[]` y vuelve a cargar.
11. Prueba el ancho móvil y el ancho de escritorio.

## Publicación y uso de IA

- **GitHub:** pendiente de crear el repositorio.
- **Vercel:** pendiente de publicar la aplicación.
- Se utilizó IA como apoyo para planear, explicar y construir el prototipo. El estudiante debe revisar el código y poder explicar sus decisiones.
