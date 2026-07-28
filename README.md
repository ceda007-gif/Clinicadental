# Clínica Dental Sonrisa — Landing Page + Panel de Administración

Landing page de marketing para una clínica dental (servicios, por qué elegirnos, equipo,
testimonios, contacto/cita vía WhatsApp) más un panel de administración ligero para editar
el contenido del sitio y ver los leads de citas.

Recreado a partir de un handoff de diseño de alta fidelidad (`design_handoff_dental_clinic/`)
como HTML/CSS/JS estático, sin build step.

## Estructura

```
index.html          Landing pública
admin.html           Panel de administración
css/styles.css        Estilos y tokens de diseño compartidos
js/content-store.js   Contenido y citas (persistidos en localStorage)
js/icons.js            Iconos SVG inline reutilizables
js/main.js             Lógica de la landing (render + formulario de contacto)
js/admin.js             Lógica del panel de administración
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

## Panel de administración (demo)

- Usuario: `admin@clinicasonrisa.com`
- Contraseña: `admin123`

Esta autenticación es solo una demo del lado del cliente (no hay backend). Antes de
publicar en producción, reemplázala por un login real y mueve el contenido/las citas a
un backend o CMS.

## Datos de ejemplo pendientes de reemplazar

Antes de publicar, actualiza (vía el panel de administración o `js/content-store.js`):

- Número de WhatsApp (`waPhone` / `waPhoneDisplay`)
- Correo, dirección y horarios
- Teléfono y dirección del JSON-LD y meta tags en `index.html`
- Fotografías (actualmente hay placeholders con patrón de rayas)

## Almacenamiento

- **Contenido del sitio**: objeto único persistido en `localStorage` (`dentalClinicContent`),
  editable desde el panel de administración.
- **Citas**: lista de leads (`dentalClinicAppointments`) que se agregan al enviar el
  formulario de contacto y se gestionan (cambiar estatus / eliminar) desde el panel.

En producción, ambos deberían moverse a un backend real.
