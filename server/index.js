import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getAppointments, addAppointment,
  updateAppointment, deleteAppointment,
  getClinicContent, updateClinicContent
} from './src/db.js';
import { getFreeSlots, AvailabilityError } from './src/availability.js';
import { runChat } from './src/chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

function requireAdmin(req, res, next) {
  const auth = req.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: 'No autorizado.' });
    return;
  }
  next();
}

app.get('/api/health', function (req, res) {
  res.json({ ok: true, aiEnabled: Boolean(process.env.GEMINI_API_KEY) });
});

app.get('/api/clinic', async function (req, res) {
  res.json(await getClinicContent());
});

app.patch('/api/clinic', requireAdmin, async function (req, res) {
  const updated = await updateClinicContent(req.body || {});
  res.json(updated);
});

app.get('/api/availability', async function (req, res) {
  const branchId = req.query.branchId;
  const date = req.query.date;
  const durationMinutes = req.query.durationMinutes;
  if (!branchId || !date) {
    res.status(400).json({ error: 'Faltan parámetros branchId y date.' });
    return;
  }
  try {
    res.json(await getFreeSlots(String(branchId), String(date), durationMinutes ? Number(durationMinutes) : undefined));
  } catch (err) {
    if (err instanceof AvailabilityError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

app.post('/api/chat', async function (req, res) {
  const body = req.body || {};
  const message = String(body.message || '').trim();
  const history = Array.isArray(body.history) ? body.history : [];
  if (!message) {
    res.status(400).json({ error: 'Falta el mensaje.' });
    return;
  }
  try {
    const result = await runChat(history, message);
    res.json(result);
  } catch (err) {
    console.error('chat error', err);
    res.status(500).json({ error: 'El asistente no está disponible en este momento.' });
  }
});

app.get('/api/appointments', requireAdmin, async function (req, res) {
  res.json(await getAppointments());
});

app.post('/api/appointments', async function (req, res) {
  const b = req.body || {};
  if (!b.branchId || !b.nombre || !b.telefono) {
    res.status(400).json({ error: 'Faltan datos requeridos (branchId, nombre, telefono).' });
    return;
  }
  const appt = Object.assign({}, b, {
    id: 'a' + Date.now() + Math.floor(Math.random() * 1000),
    status: 'nuevo',
    source: b.source || 'form',
    createdAt: new Date().toISOString()
  });
  await addAppointment(appt);
  res.status(201).json(appt);
});

app.patch('/api/appointments/:id', requireAdmin, async function (req, res) {
  const updated = await updateAppointment(req.params.id, req.body || {});
  if (!updated) {
    res.status(404).json({ error: 'Cita no encontrada.' });
    return;
  }
  res.json(updated);
});

app.delete('/api/appointments/:id', requireAdmin, async function (req, res) {
  const removed = await deleteAppointment(req.params.id);
  if (!removed) {
    res.status(404).json({ error: 'Cita no encontrada.' });
    return;
  }
  res.status(204).end();
});

// Only expose the public site's own assets — never the repo root, which would
// also publish server/data/db.json (appointment PII) and server source.
const SITE_ROOT = path.join(__dirname, '..');
app.use('/css', express.static(path.join(SITE_ROOT, 'css')));
app.use('/js', express.static(path.join(SITE_ROOT, 'js')));
app.use('/img', express.static(path.join(SITE_ROOT, 'img')));
app.get('/', function (req, res) { res.sendFile(path.join(SITE_ROOT, 'index.html')); });
app.get('/index.html', function (req, res) { res.sendFile(path.join(SITE_ROOT, 'index.html')); });
app.get('/admin.html', function (req, res) { res.sendFile(path.join(SITE_ROOT, 'admin.html')); });

app.listen(PORT, function () {
  console.log('Clinicadental API + sitio estático escuchando en el puerto ' + PORT);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY no configurada: el asistente de chat responderá con un mensaje de aviso hasta que se configure.');
  }
});
