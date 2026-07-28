import { API_BASE, ADMIN_TOKEN } from './config.js';

export const CONTENT_KEY = 'dentalClinicContentCache';
export const APPTS_KEY = 'dentalClinicAppointments';

export const SHAPE_OPTIONS = ['ring', 'diamond', 'circle', 'square', 'cross'];

export const DEFAULT_CONTENT = {
  clinicName: 'Clínica Dental Sonrisa',
  branches: [
    {
      id: 'b1',
      name: 'Sucursal Centro',
      address: 'Av. Reforma 123, Col. Centro, Ciudad de México, CP 06000',
      hoursWeekday: 'Lun–Vie 9:00–19:00',
      hoursSaturday: 'Sáb 9:00–14:00',
      waPhone: '52XXXXXXXXXX',
      waPhoneDisplay: '+52 XXX XXX XXXX',
      email: 'centro@clinicasonrisa.example'
    },
    {
      id: 'b2',
      name: 'Sucursal Norte',
      address: 'Av. Insurgentes Norte 456, Col. Lindavista, Ciudad de México, CP 07300',
      hoursWeekday: 'Lun–Vie 9:00–19:00',
      hoursSaturday: 'Sáb 9:00–14:00',
      waPhone: '52YYYYYYYYYY',
      waPhoneDisplay: '+52 YYY YYY YYYY',
      email: 'norte@clinicasonrisa.example'
    }
  ],
  hero: {
    eyebrow: 'Cuidado dental de confianza',
    title: 'Tu sonrisa está en las mejores manos',
    subtitle: 'Atención dental cercana y profesional para toda la familia. Tecnología moderna, doctores certificados y horarios que se adaptan a ti.'
  },
  heroImage: null,
  services: [
    { id: 's1', shape: 'ring', title: 'Limpieza dental', desc: 'Profilaxis profesional para mantener tu boca sana y libre de placa.' },
    { id: 's2', shape: 'diamond', title: 'Ortodoncia', desc: 'Brackets tradicionales e invisibles para alinear tu sonrisa a tu ritmo.' },
    { id: 's3', shape: 'circle', title: 'Blanqueamiento', desc: 'Aclara el color de tus dientes de forma segura y con resultados visibles.' },
    { id: 's4', shape: 'square', title: 'Endodoncia', desc: 'Tratamiento de conducto sin dolor, con tecnología de precisión.' },
    { id: 's5', shape: 'cross', title: 'Implantes dentales', desc: 'Reemplaza piezas perdidas con soluciones duraderas y naturales.' },
    { id: 's6', shape: 'ring', title: 'Odontopediatría', desc: 'Atención especializada y amigable para las sonrisas más pequeñas.' }
  ],
  whyUs: [
    { id: 'w1', shape: 'circle', title: 'Tecnología moderna', desc: 'Equipos digitales de diagnóstico para tratamientos más precisos.' },
    { id: 'w2', shape: 'cross', title: 'Doctores certificados', desc: 'Especialistas con años de experiencia y formación continua.' },
    { id: 'w3', shape: 'diamond', title: 'Ambiente cómodo', desc: 'Consultorios diseñados para que tu visita sea relajada.' }
  ],
  team: [
    { id: 't1', name: 'Dra. Ana Martínez', role: 'Ortodoncista', photo: null },
    { id: 't2', name: 'Dr. Luis Herrera', role: 'Implantólogo', photo: null },
    { id: 't3', name: 'Dra. Sofía Ramírez', role: 'Odontopediatra', photo: null }
  ],
  testimonials: [
    { id: 'r1', quote: 'Perdí el miedo al dentista. El equipo explica cada paso y siempre me siento en buenas manos.', name: 'Mariana G.' },
    { id: 'r2', quote: 'Agendar mi cita por WhatsApp fue súper rápido y me atendieron puntual.', name: 'Roberto P.' },
    { id: 'r3', quote: 'Mis hijos ya no le tienen miedo al dentista, la Dra. Ramírez es maravillosa con ellos.', name: 'Carla D.' }
  ]
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function cacheContent(content) {
  try { localStorage.setItem(CONTENT_KEY, JSON.stringify(content)); } catch (e) {}
}

function cachedContent() {
  try {
    const raw = localStorage.getItem(CONTENT_KEY);
    if (raw) return Object.assign(deepClone(DEFAULT_CONTENT), JSON.parse(raw));
  } catch (e) {}
  return deepClone(DEFAULT_CONTENT);
}

// Content (hero, sucursales, servicios, equipo, testimonios) lives on the
// backend so every visitor and device sees the same data. If the backend is
// unreachable, fall back to the last cached copy (or the built-in defaults)
// so the site still renders.
export async function loadContent() {
  try {
    const res = await fetch(API_BASE + '/api/clinic');
    if (res.ok) {
      const data = await res.json();
      const merged = Object.assign(deepClone(DEFAULT_CONTENT), data);
      cacheContent(merged);
      return merged;
    }
  } catch (e) {}
  return cachedContent();
}

// Sends a partial update (e.g. { hero: {...} } or { branches: [...] }) to the
// backend and returns the resulting full content object. Throws if the
// backend is unreachable or rejects the request — callers should surface
// that to the admin instead of silently losing the edit.
export async function saveContentPatch(patch) {
  const res = await fetch(API_BASE + '/api/clinic', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ADMIN_TOKEN },
    body: JSON.stringify(patch)
  });
  if (!res.ok) {
    throw new Error('No se pudo guardar. Verifica que el backend esté disponible.');
  }
  const data = await res.json();
  const merged = Object.assign(deepClone(DEFAULT_CONTENT), data);
  cacheContent(merged);
  return merged;
}

export function loadAppointments() {
  try {
    const raw = localStorage.getItem(APPTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function saveAppointments(list) {
  localStorage.setItem(APPTS_KEY, JSON.stringify(list));
}

export function addAppointment(appt) {
  const list = loadAppointments();
  list.unshift(appt);
  saveAppointments(list);
  return list;
}

// Tries to save the appointment on the shared backend (so it's visible from
// any device); if the backend is unreachable, falls back to this browser's
// localStorage so the booking still succeeds for the visitor.
export async function submitAppointment(appt) {
  try {
    const res = await fetch(API_BASE + '/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appt)
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  addAppointment(appt);
  return appt;
}

export function waLink(phone, message) {
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
}

export function newId(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function readImageFile(file) {
  return new Promise(function (resolve, reject) {
    if (!file.type || file.type.indexOf('image/') !== 0) {
      reject(new Error('Selecciona un archivo de imagen.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('La imagen pesa más de 2 MB. Usa una foto más ligera.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(new Error('No se pudo leer la imagen.')); };
    reader.readAsDataURL(file);
  });
}
