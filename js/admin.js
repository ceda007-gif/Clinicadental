import {
  loadContent, saveContent, loadAppointments, saveAppointments, newId
} from './content-store.js';
import { checkLogoSVG } from './icons.js';

const SECTIONS = [
  { id: 'citas', label: 'Citas' },
  { id: 'hero', label: 'Hero' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'testimonios', label: 'Testimonios' },
  { id: 'horarios', label: 'Horarios y contacto' }
];

const DEMO_USER = 'admin@clinicasonrisa.com';
const DEMO_PASS = 'admin123';

const state = {
  loggedIn: false,
  section: 'citas',
  content: loadContent(),
  draft: null,
  appointments: loadAppointments()
};
state.draft = JSON.parse(JSON.stringify(state.content));

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) + ' · ' +
      d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function flashSaved(key) {
  const el = document.getElementById('saved' + key.charAt(0).toUpperCase() + key.slice(1));
  if (!el) return;
  el.classList.remove('hidden');
  setTimeout(function () { el.classList.add('hidden'); }, 2000);
}

/* ---------- Login ---------- */

function initLogin() {
  document.getElementById('loginBrandMark').innerHTML = checkLogoSVG('#ffffff', 20);
  document.getElementById('loginClinicName').textContent = state.content.clinicName;

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');
    if (user === DEMO_USER && pass === DEMO_PASS) {
      errorEl.classList.add('hidden');
      state.loggedIn = true;
      showDashboard();
    } else {
      errorEl.textContent = 'Usuario o contraseña incorrectos.';
      errorEl.classList.remove('hidden');
    }
  });
}

function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  renderSidebar();
  switchSection('citas');
}

function showLogin() {
  state.loggedIn = false;
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

/* ---------- Sidebar / navigation ---------- */

function renderSidebar() {
  document.getElementById('sidebarBrandMark').innerHTML = checkLogoSVG('#ffffff', 16);
  document.getElementById('sidebarClinicName').textContent = state.content.clinicName;

  const nav = document.getElementById('adminNav');
  nav.innerHTML = SECTIONS.map(function (s) {
    return '<a href="#" data-section="' + s.id + '">' + escapeHtml(s.label) + '</a>';
  }).join('');

  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      switchSection(a.getAttribute('data-section'));
    });
  });

  document.getElementById('logoutLink').addEventListener('click', function (e) {
    e.preventDefault();
    showLogin();
  });
}

function switchSection(id) {
  state.section = id;
  document.querySelectorAll('.admin-nav a').forEach(function (a) {
    a.classList.toggle('active', a.getAttribute('data-section') === id);
  });
  document.querySelectorAll('.admin-view').forEach(function (view) {
    view.classList.toggle('hidden', view.id !== 'view-' + id);
  });

  if (id === 'citas') renderAppointments();
  if (id === 'hero') renderHeroForm();
  if (id === 'servicios') renderServicesForm();
  if (id === 'equipo') renderTeamForm();
  if (id === 'testimonios') renderTestimonialsForm();
  if (id === 'horarios') renderHorariosForm();
}

/* ---------- Citas ---------- */

function renderAppointments() {
  const list = document.getElementById('appointmentsList');
  const empty = document.getElementById('appointmentsEmpty');
  const appointments = state.appointments;

  if (!appointments.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = appointments.map(function (a) {
    return (
      '<div class="admin-card appt-card" data-id="' + escapeAttr(a.id) + '">' +
        '<div class="appt-main">' +
          '<p class="name">' + escapeHtml(a.nombre) + '</p>' +
          '<p class="phone">' + escapeHtml(a.telefono) + '</p>' +
        '</div>' +
        '<div class="appt-col">' +
          '<p class="label">Servicio</p>' +
          '<p class="value">' + escapeHtml(a.servicio || '—') + '</p>' +
        '</div>' +
        '<div class="appt-col msg">' +
          '<p class="label">Mensaje</p>' +
          '<p class="value">' + escapeHtml(a.mensaje || '—') + '</p>' +
        '</div>' +
        '<div class="appt-meta">' +
          '<p>' + escapeHtml(fmtDate(a.createdAt)) + '</p>' +
          '<select class="appt-status">' +
            '<option value="nuevo"' + (a.status === 'nuevo' ? ' selected' : '') + '>Nuevo</option>' +
            '<option value="contactado"' + (a.status === 'contactado' ? ' selected' : '') + '>Contactado</option>' +
            '<option value="confirmado"' + (a.status === 'confirmado' ? ' selected' : '') + '>Confirmado</option>' +
          '</select>' +
        '</div>' +
        '<button class="btn-delete">Eliminar</button>' +
      '</div>'
    );
  }).join('');

  list.querySelectorAll('.appt-card').forEach(function (card) {
    const id = card.getAttribute('data-id');
    card.querySelector('.appt-status').addEventListener('change', function (e) {
      const appt = state.appointments.find(function (a) { return a.id === id; });
      if (appt) {
        appt.status = e.target.value;
        saveAppointments(state.appointments);
      }
    });
    card.querySelector('.btn-delete').addEventListener('click', function () {
      state.appointments = state.appointments.filter(function (a) { return a.id !== id; });
      saveAppointments(state.appointments);
      renderAppointments();
    });
  });
}

/* ---------- Hero ---------- */

function renderHeroForm() {
  document.getElementById('heroEyebrowInput').value = state.draft.hero.eyebrow;
  document.getElementById('heroTitleInput').value = state.draft.hero.title;
  document.getElementById('heroSubtitleInput').value = state.draft.hero.subtitle;
}

function initHeroForm() {
  document.getElementById('heroEyebrowInput').addEventListener('input', function (e) { state.draft.hero.eyebrow = e.target.value; });
  document.getElementById('heroTitleInput').addEventListener('input', function (e) { state.draft.hero.title = e.target.value; });
  document.getElementById('heroSubtitleInput').addEventListener('input', function (e) { state.draft.hero.subtitle = e.target.value; });
  document.getElementById('saveHeroBtn').addEventListener('click', function () {
    state.content.hero = JSON.parse(JSON.stringify(state.draft.hero));
    saveContent(state.content);
    flashSaved('hero');
  });
}

/* ---------- Servicios ---------- */

function renderServicesForm() {
  const list = document.getElementById('servicesList');
  list.innerHTML = (state.draft.services || []).map(function (item, idx) {
    return (
      '<div class="admin-card" data-idx="' + idx + '">' +
        '<input type="text" class="svc-title" value="' + escapeAttr(item.title) + '" placeholder="Nombre del servicio" style="flex:1 1 200px;min-width:160px;font-weight:600">' +
        '<input type="text" class="svc-desc" value="' + escapeAttr(item.desc) + '" placeholder="Descripción breve" style="flex:2 1 260px;min-width:200px">' +
        '<button class="btn-delete">Eliminar</button>' +
      '</div>'
    );
  }).join('');

  list.querySelectorAll('.admin-card').forEach(function (card) {
    const idx = Number(card.getAttribute('data-idx'));
    card.querySelector('.svc-title').addEventListener('input', function (e) { state.draft.services[idx].title = e.target.value; });
    card.querySelector('.svc-desc').addEventListener('input', function (e) { state.draft.services[idx].desc = e.target.value; });
    card.querySelector('.btn-delete').addEventListener('click', function () {
      state.draft.services.splice(idx, 1);
      renderServicesForm();
    });
  });
}

function initServicesForm() {
  document.getElementById('addServiceBtn').addEventListener('click', function () {
    state.draft.services.push({ id: newId('s'), shape: 'circle', title: 'Nuevo servicio', desc: 'Descripción breve del tratamiento.' });
    renderServicesForm();
  });
  document.getElementById('saveServicesBtn').addEventListener('click', function () {
    state.content.services = JSON.parse(JSON.stringify(state.draft.services));
    saveContent(state.content);
    flashSaved('servicios');
  });
}

/* ---------- Equipo ---------- */

function renderTeamForm() {
  const list = document.getElementById('teamList');
  list.innerHTML = (state.draft.team || []).map(function (item, idx) {
    return (
      '<div class="admin-card" data-idx="' + idx + '">' +
        '<input type="text" class="team-name" value="' + escapeAttr(item.name) + '" placeholder="Nombre" style="flex:1 1 200px;min-width:160px;font-weight:600">' +
        '<input type="text" class="team-role" value="' + escapeAttr(item.role) + '" placeholder="Especialidad" style="flex:1 1 200px;min-width:160px">' +
        '<button class="btn-delete">Eliminar</button>' +
      '</div>'
    );
  }).join('');

  list.querySelectorAll('.admin-card').forEach(function (card) {
    const idx = Number(card.getAttribute('data-idx'));
    card.querySelector('.team-name').addEventListener('input', function (e) { state.draft.team[idx].name = e.target.value; });
    card.querySelector('.team-role').addEventListener('input', function (e) { state.draft.team[idx].role = e.target.value; });
    card.querySelector('.btn-delete').addEventListener('click', function () {
      state.draft.team.splice(idx, 1);
      renderTeamForm();
    });
  });
}

function initTeamForm() {
  document.getElementById('addTeamBtn').addEventListener('click', function () {
    state.draft.team.push({ id: newId('t'), name: 'Nuevo doctor(a)', role: 'Especialidad' });
    renderTeamForm();
  });
  document.getElementById('saveTeamBtn').addEventListener('click', function () {
    state.content.team = JSON.parse(JSON.stringify(state.draft.team));
    saveContent(state.content);
    flashSaved('equipo');
  });
}

/* ---------- Testimonios ---------- */

function renderTestimonialsForm() {
  const list = document.getElementById('testimonialsList');
  list.innerHTML = (state.draft.testimonials || []).map(function (item, idx) {
    return (
      '<div class="admin-card" data-idx="' + idx + '" style="align-items:flex-start">' +
        '<textarea class="tst-quote" placeholder="Reseña" rows="2" style="flex:2 1 260px;min-width:220px">' + escapeHtml(item.quote) + '</textarea>' +
        '<input type="text" class="tst-name" value="' + escapeAttr(item.name) + '" placeholder="Nombre del paciente" style="flex:1 1 160px;min-width:140px">' +
        '<button class="btn-delete">Eliminar</button>' +
      '</div>'
    );
  }).join('');

  list.querySelectorAll('.admin-card').forEach(function (card) {
    const idx = Number(card.getAttribute('data-idx'));
    card.querySelector('.tst-quote').addEventListener('input', function (e) { state.draft.testimonials[idx].quote = e.target.value; });
    card.querySelector('.tst-name').addEventListener('input', function (e) { state.draft.testimonials[idx].name = e.target.value; });
    card.querySelector('.btn-delete').addEventListener('click', function () {
      state.draft.testimonials.splice(idx, 1);
      renderTestimonialsForm();
    });
  });
}

function initTestimonialsForm() {
  document.getElementById('addTestimonialBtn').addEventListener('click', function () {
    state.draft.testimonials.push({ id: newId('r'), quote: 'Nueva reseña de paciente.', name: 'Nombre del paciente' });
    renderTestimonialsForm();
  });
  document.getElementById('saveTestimonialsBtn').addEventListener('click', function () {
    state.content.testimonials = JSON.parse(JSON.stringify(state.draft.testimonials));
    saveContent(state.content);
    flashSaved('testimonios');
  });
}

/* ---------- Horarios y contacto ---------- */

function renderHorariosForm() {
  document.getElementById('infoAddress').value = state.draft.address;
  document.getElementById('infoHoursWeekday').value = state.draft.hoursWeekday;
  document.getElementById('infoHoursSaturday').value = state.draft.hoursSaturday;
  document.getElementById('infoWaPhoneDisplay').value = state.draft.waPhoneDisplay;
  document.getElementById('infoWaPhone').value = state.draft.waPhone;
  document.getElementById('infoEmail').value = state.draft.email;
}

function initHorariosForm() {
  document.getElementById('infoAddress').addEventListener('input', function (e) { state.draft.address = e.target.value; });
  document.getElementById('infoHoursWeekday').addEventListener('input', function (e) { state.draft.hoursWeekday = e.target.value; });
  document.getElementById('infoHoursSaturday').addEventListener('input', function (e) { state.draft.hoursSaturday = e.target.value; });
  document.getElementById('infoWaPhoneDisplay').addEventListener('input', function (e) { state.draft.waPhoneDisplay = e.target.value; });
  document.getElementById('infoWaPhone').addEventListener('input', function (e) { state.draft.waPhone = e.target.value; });
  document.getElementById('infoEmail').addEventListener('input', function (e) { state.draft.email = e.target.value; });
  document.getElementById('saveInfoBtn').addEventListener('click', function () {
    state.content.address = state.draft.address;
    state.content.hoursWeekday = state.draft.hoursWeekday;
    state.content.hoursSaturday = state.draft.hoursSaturday;
    state.content.waPhoneDisplay = state.draft.waPhoneDisplay;
    state.content.waPhone = state.draft.waPhone;
    state.content.email = state.draft.email;
    saveContent(state.content);
    flashSaved('horarios');
  });
}

/* ---------- Init ---------- */

initLogin();
initHeroForm();
initServicesForm();
initTeamForm();
initTestimonialsForm();
initHorariosForm();
