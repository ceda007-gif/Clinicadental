# Clínica Dental Sonrisa — Landing Page + Panel de Administración

Landing page de marketing para una clínica dental con **dos sucursales** (servicios, por qué
elegirnos, equipo y testimonios compartidos por la marca; dirección, horario, WhatsApp y
correo independientes por sucursal) más un panel de administración ligero para editar el
contenido del sitio y ver los leads de citas.

Recreado a partir de un handoff de diseño de alta fidelidad (`design_handoff_dental_clinic/`)
como HTML/CSS/JS estático, sin build step.

También incluye un **asistente de citas con IA** (chat en la landing) que conversa con el
paciente, pregunta sucursal/servicio/datos de contacto, consulta un calendario real de
disponibilidad y agenda la cita — usando la API de Claude, vía un backend en `server/`.

## Estructura

```
index.html          Landing pública (incluye el widget de chat)
admin.html           Panel de administración
css/styles.css        Estilos y tokens de diseño compartidos
js/content-store.js   Contenido y citas del formulario (persistidos en localStorage)
js/config.js           URL del backend / token de admin para llamadas a la API
js/icons.js            Iconos SVG inline reutilizables
js/main.js             Lógica de la landing (render + formulario de contacto)
js/admin.js             Lógica del panel de administración (incluye citas del bot)
js/chat-widget.js       Widget de chat que habla con el backend

server/                Backend Node/Express: calendario de disponibilidad, citas
                        compartidas y el agente de IA (server/src/chat.js)
```

## Cómo correrlo

Ambas páginas usan ES modules (`import`/`export`), por lo que deben servirse por HTTP
(no funcionan abriendo el `.html` directamente con `file://`). Por ejemplo:

```bash
npx serve .
# o
python3 -m http.server 8080
```

Luego abre `http://localhost:8080/` para la landing y `http://localhost:8080/admin.html`
para el panel de administración.

## Asistente de citas con IA

El backend vive en `server/` y hace tres cosas:

1. Sirve una API de disponibilidad (`GET /api/availability`) calculada a partir del horario
   de cada sucursal (`server/src/db.js`) y las citas ya agendadas — nunca inventa horarios.
2. Expone el agente conversacional (`POST /api/chat`), que usa la API de Claude con
   *tool use* para consultar sucursales/servicios/disponibilidad y agendar
   (`server/src/chat.js`). El mismo agente atiende ambas sucursales: pregunta cuál le
   interesa al paciente (o la usa si ya se sabe) y solo ofrece horarios reales de esa sucursal.
3. Guarda las citas agendadas (por el bot o por el formulario) en `server/data/db.json`
   — el panel de administración (sección **Citas**) las combina con las del formulario y
   marca cada una como "Asistente IA" o "Formulario".

### Correrlo en local

```bash
cd server
npm install
cp .env.example .env   # agrega tu ANTHROPIC_API_KEY
npm start              # sirve la API en :3001 y también el sitio estático
```

Abre `http://localhost:3001/` — el chat y el sitio funcionan desde el mismo servidor.
Sin `ANTHROPIC_API_KEY`, el resto del sitio funciona igual, pero el chat responde con un
aviso de "asistente no activado todavía" en vez de conversar.

### Desplegarlo

El backend es un servidor Node normal (Express) — se puede desplegar en Render, Railway,
Fly.io, etc. Variables de entorno necesarias: `ANTHROPIC_API_KEY` (obligatoria para que el
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

Antes de publicar, actualiza (vía el panel de administración, sección **Sucursales**, o
`js/content-store.js`):

- Nombre, dirección, horarios, correo y número de WhatsApp de cada sucursal
- Teléfono y dirección del JSON-LD y meta tags en `index.html`
- Fotografías (actualmente hay placeholders con patrón de rayas)

Se puede agregar o quitar sucursales desde el mismo panel ("+ Agregar sucursal" / "Eliminar").
Servicios, equipo y testimonios son compartidos por ambas sucursales; si necesitas que
varíen por sucursal, hay que extender el modelo de datos.

## Almacenamiento

- **Contenido del sitio** (hero, servicios, equipo, testimonios, sucursales): objeto único
  persistido en `localStorage` (`dentalClinicContent`), editable desde el panel de
  administración. Nota: los datos de sucursales aquí (horarios, teléfonos) son independientes
  de los que usa el backend para calcular disponibilidad (`server/src/db.js`) — hoy hay que
  mantenerlos sincronizados a mano si cambian.
- **Citas del formulario de contacto**: lista en `localStorage` (`dentalClinicAppointments`).
- **Citas del asistente de IA y calendario de disponibilidad**: en `server/data/db.json`
  (backend), compartido entre todas las visitas — no depende del navegador de cada quien.

En producción, lo ideal es mover también el contenido del sitio (hoy en `localStorage`) al
backend, para tener una sola fuente de verdad.
