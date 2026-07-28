# Clínica Dental Sonrisa — Landing Page + Panel de Administración

Landing page de marketing para una clínica dental con **dos sucursales** (servicios, por qué
elegirnos, equipo y testimonios compartidos por la marca; dirección, horario, WhatsApp y
correo independientes por sucursal) más un panel de administración ligero para editar el
contenido del sitio y ver los leads de citas.

Recreado a partir de un handoff de diseño de alta fidelidad (`design_handoff_dental_clinic/`)
como HTML/CSS/JS estático, sin build step.

También incluye un **asistente de citas con IA** (chat en la landing) que conversa con el
paciente, pregunta sucursal/servicio/datos de contacto, consulta un calendario real de
disponibilidad y agenda la cita — usando la API de Gemini, vía un backend en `server/`.

## Estructura

```
index.html          Landing pública (incluye el widget de chat)
admin.html           Panel de administración
css/styles.css        Estilos y tokens de diseño compartidos
js/content-store.js   Cliente de la API de contenido/citas (con respaldo local si el backend no responde)
js/config.js           URL del backend / token de admin para llamadas a la API
js/icons.js            Iconos SVG inline reutilizables
js/main.js             Lógica de la landing (render + formulario de contacto)
js/admin.js             Lógica del panel de administración (incluye citas del bot)
js/chat-widget.js       Widget de chat que habla con el backend

server/                Backend Node/Express: contenido del sitio, calendario de
                        disponibilidad, citas compartidas y el agente de IA
                        (server/src/chat.js)
```

## Cómo correrlo

El contenido del sitio (hero, sucursales, servicios, equipo, testimonios) y las citas
viven en el backend (`server/`), para que sean los mismos en cualquier dispositivo —
computadora, celular, el navegador de un paciente, etc. Para tener el sitio completo
(landing + admin + backend) corriendo en un solo lugar:

```bash
cd server
npm install
npm start   # sirve la API en :3001 y también index.html / admin.html
```

Abre `http://localhost:3001/`.

También puedes abrir `index.html`/`admin.html` sueltos con un servidor estático
(`npx serve .`, `python3 -m http.server 8080`) — funcionan sin backend, pero **en modo
solo lectura con los datos de ejemplo**: sin backend, cualquier edición desde el panel de
administración falla (no hay dónde guardarla) y todos los visitantes ven siempre el mismo
contenido de ejemplo, sin importar lo que se haya intentado editar antes.

## Asistente de citas con IA

El backend vive en `server/` y hace tres cosas:

1. Sirve una API de disponibilidad (`GET /api/availability`) calculada a partir del horario
   de cada sucursal (`server/src/db.js`) y las citas ya agendadas — nunca inventa horarios.
2. Expone el agente conversacional (`POST /api/chat`), que usa la API de Gemini con
   *function calling* para consultar sucursales/servicios/disponibilidad y agendar
   (`server/src/chat.js`). El mismo agente atiende ambas sucursales: pregunta cuál le
   interesa al paciente (o la usa si ya se sabe) y solo ofrece horarios reales de esa sucursal.
3. Guarda las citas agendadas (por el bot o por el formulario) en `server/data/db.json`
   — el panel de administración (sección **Citas**) las combina con las del formulario y
   marca cada una como "Asistente IA" o "Formulario".

El nivel gratuito de Gemini limita las solicitudes por minuto **por modelo**. Si el modelo
preferido se satura (o deja de estar disponible), el bot salta automáticamente al
siguiente de la lista (`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-2.0-flash-lite`,
configurable con `GEMINI_MODEL` en `server/.env`) en vez de esperar — cada modelo tiene su
propia cuota independiente. Si haces muchas pruebas seguidas en poco tiempo, es normal
toparte con este límite ocasionalmente (incluso con los tres) — se recupera solo en menos
de un minuto.

Para que el chat converse de verdad (y no solo el resto del sitio), copia
`server/.env.example` a `server/.env` y agrega tu `GEMINI_API_KEY` (se obtiene gratis en
[aistudio.google.com/apikey](https://aistudio.google.com/apikey)) antes de `npm start`.
Sin ella, el sitio y el panel funcionan igual, pero el chat responde con un aviso de
"asistente no activado todavía" en vez de conversar.

### Desplegarlo

El backend es un servidor Node normal (Express) — se puede desplegar en Render, Railway,
Fly.io, etc. Variables de entorno necesarias: `GEMINI_API_KEY` (obligatoria para que el
chat funcione) y `ADMIN_TOKEN` (protege los endpoints de citas del panel de administración).

Si el sitio estático sigue en GitHub Pages y el backend en otro dominio, hay que apuntar el
frontend al backend editando, en `index.html` y `admin.html`, la línea:

```html
<script>window.CLINICADENTAL_API_BASE = '';</script>
```

por la URL pública del backend, p. ej. `'https://clinicadental-api.onrender.com'`. Si en
cambio se despliega `server/` completo (incluye `app.use(express.static(...))` sirviendo
la raíz del repo), no hace falta cambiar nada — todo corre en el mismo origen.

## Panel de administración (demo)

- Usuario: `admin@clinicasonrisa.com`
- Contraseña: `admin123`

Esta autenticación sigue siendo una demo del lado del cliente (el login del panel no pasa
por el backend). Las llamadas del panel a la API de citas del backend usan por separado el
`ADMIN_TOKEN` configurado en `server/.env` (ver `js/config.js`). Antes de publicar en
producción, reemplaza ambas por un login real.

## Datos de ejemplo pendientes de reemplazar

Antes de publicar, actualiza **desde el panel de administración** (con el backend
desplegado y accesible):

- Nombre, dirección, horarios, correo y número de WhatsApp de cada sucursal (sección
  **Sucursales**)
- Teléfono y dirección del JSON-LD y meta tags en `index.html` (esto es estático, se edita
  a mano en el archivo)
- Fotografías (actualmente hay placeholders con patrón de rayas)

Se puede agregar o quitar sucursales desde el mismo panel ("+ Agregar sucursal" / "Eliminar").
Servicios, equipo y testimonios son compartidos por ambas sucursales; si necesitas que
varíen por sucursal, hay que extender el modelo de datos. El horario que usa el calendario
de disponibilidad del asistente de IA (`schedule` en `server/src/db.js`, horas exactas por
día) es un dato aparte de los textos `hoursWeekday`/`hoursSaturday` que se muestran en la
página — si cambias el horario real de una sucursal, actualiza ambos.

## Almacenamiento

Todo vive en el backend, en `server/data/db.json` (se genera solo, a partir de datos de
ejemplo, la primera vez que corres el servidor):

- **Contenido del sitio** (hero, sucursales, servicios, equipo, testimonios): se lee con
  `GET /api/clinic` y se edita con `PATCH /api/clinic` (protegido con `ADMIN_TOKEN`) desde
  el panel de administración.
- **Citas** (del formulario o del asistente de IA): `GET/POST /api/appointments`,
  `PATCH/DELETE /api/appointments/:id`.
- **Calendario de disponibilidad**: calculado a partir del horario (`schedule`) de cada
  sucursal y las citas ya guardadas.

El navegador solo guarda una copia en caché (`localStorage`) por si el backend está
temporalmente inaccesible, para que el sitio no se caiga. Pero la fuente de verdad — y lo
que ve cualquier visitante, en cualquier dispositivo — es siempre el backend. Sin backend
desplegado y accesible, las ediciones desde el panel de administración fallan con un aviso
(no se pierden en silencio), y el sitio público muestra la última copia en caché de ese
navegador o, si nunca hubo una, los datos de ejemplo.
