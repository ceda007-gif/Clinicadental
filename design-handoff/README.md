# Handoff: Clínica Dental Sonrisa — Landing Page + Admin Panel

## Overview
A marketing landing page for a dental clinic (services, why-us, team, testimonials, contact/appointment form via WhatsApp) plus a lightweight admin panel to edit site content and view appointment leads.

## About the Design Files
The files in this bundle are **design references built in HTML** (a custom component format, `.dc.html`) — working prototypes showing intended look, content, and behavior, not production code to copy directly. The task is to **recreate these designs in the target codebase's environment** (React, Vue, etc. — or choose the best fit if none exists) using its existing patterns, component library, and state management. Treat the inline styles as the visual spec, not as CSS to lift verbatim.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final/near-final and should be recreated pixel-accurately. Placeholder content marked "de ejemplo" (WhatsApp number, address, hours, email, photos) must be replaced with real data before launch — these are flagged inline in the files and below.

## Screens / Views

### 1. Landing Page (`Landing Dental Final.dc.html`)
Single-page site with sticky header + anchor-linked sections.

- **Header** — sticky, white bg, bottom border `rgba(14,165,233,.12)`. Logo mark (38px rounded-square, bg `#0ea5e9`, white checkmark-in-circle SVG) + clinic name (Poppins 600 19px). Nav links (Inter 500 15px, color `#425059`, hover `#0ea5e9`) to Servicios/Por qué elegirnos/Equipo/Testimonios/Contacto. CTA pill button "Agendar cita" (bg `#0ea5e9`, hover `#0284c7`, white text, 999px radius).
- **Hero** — two-column flex (min 420px/300px), gradient bg `linear-gradient(180deg,#f2f9fd 0%,#ffffff 70%)`, padding 76px/40px/84px. Eyebrow pill (bg `#e0f2fe`, text `#0284c7`), H1 (Poppins 600, clamp(32px,4vw,48px)), subtitle paragraph (`#526169`, max-width 460px), two CTAs (WhatsApp filled pill + outlined "Ver servicios" pill), small disclaimer text about the placeholder WhatsApp number. Right side: image placeholder (4:3, diagonal-stripe pattern in light blues) for clinic/team photo.
- **Servicios** — centered heading block, then responsive grid (`auto-fit, minmax(260px,1fr)`, gap 24px) of service cards: white bg, 20px radius, subtle shadow, 48px icon tile (bg `#e0f2fe`) with one of 5 simple geometric icon shapes (circle/diamond/square/cross/ring in `#0284c7`), title (Poppins 600 18px), description (14.5px, `#5b6b72`). 6 services: Limpieza dental (implied by remaining slots), Ortodoncia, Blanqueamiento, Endodoncia, Implantes dentales, Odontopediatría.
- **Por qué elegirnos** — bg `#f4f8f9`, centered heading, grid of 3 items (icon circle 56px white w/ shadow, title 16.5px, description 14px): Tecnología moderna, Doctores certificados, Ambiente cómodo. (A 4th item, "Pagos flexibles", was removed per latest edit.)
- **Equipo** — grid of team cards (photo placeholder square 20px radius diagonal-stripe pattern, name Poppins 600 17px, role 14px `#0284c7`).
- **Testimonios** — bg `#f4f8f9`, cards with quote-mark icon, italic quote, bold name.
- **Contacto** — two-column: left panel bg `#0ea5e9`, white text, WhatsApp CTA button (white bg, `#0284c7` text); right panel light-gray form (nombre, teléfono, servicio select, mensaje textarea, submit button) — client-side validation on nombre/teléfono, on submit builds a WhatsApp deep link with the form data and opens it in a new tab, plus persists the lead to local appointment storage.
- **Footer** — dark bg `#16232b`, 3-column grid (logo/blurb, address/hours, contact + social icon buttons), bottom bar with copyright + link to Admin panel.

### 2. Admin Panel (`Admin.dc.html`)
- **Login screen** — centered card (360px, white, 20px radius, shadow), logo, "Panel de administración" heading, login form.
- **Dashboard** (post-login) — content editing for the same fields the landing page reads (clinic name, WhatsApp number, hero copy, services list, why-us list, team, testimonials, address/hours/email) and a list/table of appointment leads submitted through the landing page contact form.

## Interactions & Behavior
- All landing-page copy and lists (services, whyUs, team, testimonials, contact info) are data-driven from a shared content store, editable via the Admin panel — not hardcoded per screen.
- Contact form: required-field validation (nombre, teléfono) with inline error text in red (`#c0392b`); on success, composes a message and opens `https://wa.me/<phone>?text=...`, saves the lead record, and shows a confirmation line below the form.
- Hover states: nav links and buttons darken/shift shade (see hex pairs above, e.g. `#0ea5e9` → `#0284c7`).
- Anchor navigation: header nav links and hero CTA scroll to in-page sections (`#servicios`, `#nosotros`, `#equipo`, `#testimonios`, `#contacto`).
- Responsive: all grids use CSS Grid `auto-fit`/`minmax` and flex-wrap — sections reflow to single column on narrow viewports; no fixed breakpoints needed if using an equivalent auto-fit grid.

## State Management
- Content: single object (`clinicName, waPhone, waPhoneDisplay, email, address, hoursWeekday, hoursSaturday, hero{eyebrow,title,subtitle}, services[], whyUs[], team[], testimonials[]`), persisted client-side and editable from Admin. In production this should move to a real backend/CMS.
- Appointments: array of lead records (`id, nombre, telefono, servicio, mensaje, createdAt, status`), appended on each contact-form submission, viewable in Admin.
- Contact form local state: field values + validation errors + submitted flag.

## Design Tokens
- **Colors**: primary accent `#0ea5e9` (sky blue), accent-dark/hover `#0284c7`, accent-tint bg `#e0f2fe` / `#eaf6fd` / `#f2f9fd`, ink/text `#16232b` (headings), body text `#5b6b72` / `#526169` / `#425059`, muted `#8a969b` / `#9fadb3` / `#6d7b81`, neutral section bg `#f4f8f9`, footer bg `#16232b` / `#1f2f38`, error `#c0392b`, borders `rgba(14,165,233,.12)` / `#d9e3e2`.
- **Typography**: Headings — Poppins 600 (weights 500/600/700 loaded). Body/UI — Inter (400/500/600). Sizes: H1 clamp(32–48px), H2 clamp(26–34px), H3 16.5–20px, body 14–17px, small print 12–13px.
- **Radius**: pills/buttons 999px, cards 20–24px, small tiles 10–14px, icon chips 12px.
- **Shadows**: cards `0 8px 24px rgba(16,24,32,.05)`, elevated elements `0 20px 40px rgba(16,24,32,.08)`, small `0 6px 16px rgba(16,24,32,.06)`.
- **Spacing**: section padding ~80–88px vertical / 40px horizontal; grid/flex gaps 24–36px.

## Assets
- No photographic assets — hero, team, and clinic images are placeholders (diagonal-stripe pattern blocks with a text label) awaiting real photography.
- Icons are inline SVG (simple geometric shapes for service/why-us tiles; a WhatsApp glyph; social "fb"/"ig"/"wa" text badges in the footer — real icon assets should replace these text badges).
- Google Fonts: Poppins (500/600/700), Inter (400/500/600).

## Files
- `Landing Dental Final.dc.html` — the public landing page (source of truth for the above).
- `Admin.dc.html` — the admin/content-editing panel.
- `dental-content-store.js` — shared content/appointments data module the two pages read/write (reference for the data shape, storage keys, and helper functions like `waLink()` and `shapeFlags()`).
