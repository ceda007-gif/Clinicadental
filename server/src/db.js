import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const CONTENT_KEYS = ['clinicName', 'hero', 'heroImage', 'services', 'whyUs', 'team', 'testimonials', 'branches', 'assistantInstructions', 'gallery'];

const SEED = {
  clinicName: 'Clínica Dental Sonrisa',
  assistantInstructions: '',
  hero: {
    eyebrow: 'Cuidado dental de confianza',
    title: 'Tu sonrisa está en las mejores manos',
    subtitle: 'Atención dental cercana y profesional para toda la familia. Tecnología moderna, doctores certificados y horarios que se adaptan a ti.'
  },
  heroImage: null,
  gallery: [],
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
  ],
  branches: [
    {
      id: 'b1',
      name: 'Sucursal Centro',
      address: 'Av. Reforma 123, Col. Centro, Ciudad de México, CP 06000',
      hoursWeekday: 'Lun–Vie 9:00–19:00',
      hoursSaturday: 'Sáb 9:00–14:00',
      waPhone: '52XXXXXXXXXX',
      waPhoneDisplay: '+52 XXX XXX XXXX',
      email: 'centro@clinicasonrisa.example',
      slotMinutes: 30,
      schedule: {
        mon: { open: '09:00', close: '19:00' },
        tue: { open: '09:00', close: '19:00' },
        wed: { open: '09:00', close: '19:00' },
        thu: { open: '09:00', close: '19:00' },
        fri: { open: '09:00', close: '19:00' },
        sat: { open: '09:00', close: '14:00' },
        sun: null
      }
    },
    {
      id: 'b2',
      name: 'Sucursal Norte',
      address: 'Av. Insurgentes Norte 456, Col. Lindavista, Ciudad de México, CP 07300',
      hoursWeekday: 'Lun–Vie 9:00–19:00',
      hoursSaturday: 'Sáb 9:00–14:00',
      waPhone: '52YYYYYYYYYY',
      waPhoneDisplay: '+52 YYY YYY YYYY',
      email: 'norte@clinicasonrisa.example',
      slotMinutes: 30,
      schedule: {
        mon: { open: '09:00', close: '19:00' },
        tue: { open: '09:00', close: '19:00' },
        wed: { open: '09:00', close: '19:00' },
        thu: { open: '09:00', close: '19:00' },
        fri: { open: '09:00', close: '19:00' },
        sat: { open: '09:00', close: '14:00' },
        sun: null
      }
    }
  ],
  services: [
    { id: 's1', shape: 'ring', title: 'Limpieza dental', desc: 'Profilaxis profesional para mantener tu boca sana y libre de placa.', durationMinutes: 45 },
    { id: 's2', shape: 'diamond', title: 'Ortodoncia', desc: 'Brackets tradicionales e invisibles para alinear tu sonrisa a tu ritmo.', durationMinutes: 30 },
    { id: 's3', shape: 'circle', title: 'Blanqueamiento', desc: 'Aclara el color de tus dientes de forma segura y con resultados visibles.', durationMinutes: 45 },
    { id: 's4', shape: 'square', title: 'Endodoncia', desc: 'Tratamiento de conducto sin dolor, con tecnología de precisión.', durationMinutes: 60 },
    { id: 's5', shape: 'cross', title: 'Implantes dentales', desc: 'Reemplaza piezas perdidas con soluciones duraderas y naturales.', durationMinutes: 60 },
    { id: 's6', shape: 'ring', title: 'Odontopediatría', desc: 'Atención especializada y amigable para las sonrisas más pequeñas.', durationMinutes: 30 },
    { id: 's7', shape: 'circle', title: 'Solo valoración', desc: 'Revisión inicial para diagnosticar y recomendar el mejor tratamiento.', durationMinutes: 20 }
  ],
  appointments: []
};

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(data) {
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, DB_PATH);
}

export function getBranches() {
  return readDb().branches;
}

export function getBranch(id) {
  return readDb().branches.find(function (b) { return b.id === id; }) || null;
}

export function getServices() {
  return readDb().services;
}

export function getService(idOrTitle) {
  const services = readDb().services;
  return services.find(function (s) { return s.id === idOrTitle || s.title === idOrTitle; }) || null;
}

export function getAppointments(filter) {
  const list = readDb().appointments;
  if (!filter) return list;
  return list.filter(function (a) {
    if (filter.branchId && a.branchId !== filter.branchId) return false;
    if (filter.date && a.date !== filter.date) return false;
    return true;
  });
}

export function addAppointment(appt) {
  const db = readDb();
  db.appointments.unshift(appt);
  writeDb(db);
  return appt;
}

export function updateAppointment(id, patch) {
  const db = readDb();
  const idx = db.appointments.findIndex(function (a) { return a.id === id; });
  if (idx === -1) return null;
  db.appointments[idx] = Object.assign({}, db.appointments[idx], patch);
  writeDb(db);
  return db.appointments[idx];
}

export function deleteAppointment(id) {
  const db = readDb();
  const next = db.appointments.filter(function (a) { return a.id !== id; });
  const removed = next.length !== db.appointments.length;
  db.appointments = next;
  writeDb(db);
  return removed;
}

export function getClinicName() {
  return readDb().clinicName;
}

export function getClinicContent() {
  const db = readDb();
  const content = {};
  CONTENT_KEYS.forEach(function (key) { content[key] = db[key]; });
  return content;
}

export function getAssistantInstructions() {
  return readDb().assistantInstructions || '';
}

export function updateClinicContent(patch) {
  const db = readDb();
  CONTENT_KEYS.forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      db[key] = patch[key];
    }
  });
  writeDb(db);
  return getClinicContentFrom(db);
}

function getClinicContentFrom(db) {
  const content = {};
  CONTENT_KEYS.forEach(function (key) { content[key] = db[key]; });
  return content;
}
