import {
  loadContent, saveContent, loadAppointments, saveAppointments, newId, readImageFile
} from './content-store.js';
import { checkLogoSVG } from './icons.js';
import { API_BASE, ADMIN_TOKEN } from './config.js';

const SECTIONS = [
  { id: 'citas', label: 'Citas' },
  { id: 'hero', label: 'Hero' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'testimonios', label: 'Testimonios' },
  { id: 'sucursales', label: 'Sucursales' }
];

const DEMO_USER = 'admin@clinicasonrisa.com';
const DEMO_PASS = 'admin123';

const state = {
  loggedIn: false,
  section: 'citas',
  content: loadContent(),
  draft: null,
  appointments: loadAppointments(),
  remoteAppointments: []
};
state.draft = JSON.parse(JSON.stringify(state.content));

function branchNameById(branchId) {
  const branch = (state.content.branches || []).find(function (b) { return b.id === branchId; });
  return branch ? branch.name : null;
}

function normalizeAppt(a, isRemote) {
  return {
    id: a.id,
    remote: isRemote,
    sucursalNombre: a.sucursalNombre || branchNameById(a.branchId) || '—',
    nombre: a.nombre || '—',
    phone: a.telefono || a.whatsapp || '—',
    servicio: a.servicio || a.service || '',
    mensaje: a.mensaje || a.notes || '',
    fecha: a.date ? (a.date + (a.time ? ' ' + a.time : '')) : '',
    createdAt: a.createdAt,
    status: a.status || 'nuevo',
    source: a.source || (isRemote ? 'chat' : 'form')
  };
}

async function fetchRemoteAppointments() {
  if (!API_BASE && window.location.protocol !== 'http:' && window.location.protocol !== 'https:') return [];
  try {
    const res = await fetch(API_BASE + '/api/appointments', {
      headers: { Authorization: 'Bearer ' + ADMIN_TOKEN }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

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
  if (id === 'sucursales') renderBranchesForm();
}

/* ---------- Citas ---------- */

async function renderAppointments() {
  const list = document.getElementById('appointmentsList');
  const empty = document.getElementById('appointmentsEmpty');

  state.remoteAppointments = await fetchRemoteAppointments();

  const merged = state.appointments.map(function (a) { return normalizeAppt(a, false); })
    .concat(state.remoteAppointments.map(function (a) { return normalizeAppt(a, true); }))
    .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

  if (!merged.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = merged.map(function (a) {
    const sourceLabel = a.source === 'chat' ? 'Asistente IA' : 'Formulario';
    return (
      '<div class="admin-card appt-card" data-id="' + escapeAttr(a.id) + '" data-remote="' + (a.remote ? '1' : '0') + '">' +
        '<div class="appt-main">' +
          '<p class="name">' + escapeHtml(a.nombre) + '</p>' +
          '<p class="phone">' + escapeHtml(a.phone) + ' · <span class="appt-source">' + escapeHtml(sourceLabel) + '</span></p>' +
        '</div>' +
        '<div class="appt-col">' +
          '<p class="label">Sucursal</p>' +
          '<p class="value">' + escapeHtml(a.sucursalNombre) + (a.fecha ? '<br>' + escapeHtml(a.fecha) : '') + '</p>' +
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
    const isRemote = card.getAttribute('data-remote') === '1';

    card.querySelector('.appt-status').addEventListener('change', function (e) {
      const newStatus = e.target.value;
      if (isRemote) {
        fetch(API_BASE + '/api/appointments/' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + ADMIN_TOKEN },
          body: JSON.stringify({ status: newStatus })
        }).catch(function () {});
        return;
      }
      const appt = state.appointments.find(function (a) { return a.id === id; });
      if (appt) {
        appt.status = newStatus;
        saveAppointments(state.appointments);
      }
    });

    card.querySelector('.btn-delete').addEventListener('click', function () {
      if (isRemote) {
        fetch(API_BASE + '/api/appointments/' + encodeURIComponent(id), {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + ADMIN_TOKEN }
        }).finally(renderAppointments);
        return;
      }
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
  renderHeroImagePreview();
}

function renderHeroImagePreview() {
  const preview = document.getElementById('heroImagePreview');
  const removeBtn = document.getElementById('removeHeroImageBtn');
  if (state.draft.heroImage) {
    preview.innerHTML = '<img src="' + state.draft.heroImage + '" alt="">';
    removeBtn.classList.remove('hidden');
  } else {
    preview.innerHTML = '<span>Sin foto</span>';
    removeBtn.classList.add('hidden');
  }
}

function initHeroForm() {
  document.getElementById('heroEyebrowInput').addEventListener('input', function (e) { state.draft.hero.eyebrow = e.target.value; });
  document.getElementById('heroTitleInput').addEventListener('input', function (e) { state.draft.hero.title = e.target.value; });
  document.getElementById('heroSubtitleInput').addEventListener('input', function (e) { state.draft.hero.subtitle = e.target.value; });

  const errorEl = document.getElementById('heroImageError');
  document.getElementById('heroImageInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    readImageFile(file).then(function (dataUrl) {
      errorEl.classList.add('hidden');
      state.draft.heroImage = dataUrl;
      renderHeroImagePreview();
    }).catch(function (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    });
  });
  document.getElementById('removeHeroImageBtn').addEventListener('click', function () {
    state.draft.heroImage = null;
    renderHeroImagePreview();
  });

  document.getElementById('saveHeroBtn').addEventListener('click', function () {
    state.content.hero = JSON.parse(JSON.stringify(state.draft.hero));
    state.content.heroImage = state.draft.heroImage || null;
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
    const photoPreview = item.photo
      ? '<img src="' + item.photo + '" alt="">'
      : '<span>Sin foto</span>';
    return (
      '<div class="admin-card" data-idx="' + idx + '">' +
        '<div class="photo-field">' +
          '<div class="photo-preview">' + photoPreview + '</div>' +
          '<div class="photo-field-actions">' +
            '<label class="btn btn-admin btn-file">Subir<input type="file" class="team-photo-input" accept="image/*" hidden></label>' +
            (item.photo ? '<button type="button" class="btn-text-remove team-photo-remove">Quitar</button>' : '') +
          '</div>' +
        '</div>' +
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
    card.querySelector('.team-photo-input').addEventListener('change', function (e) {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      readImageFile(file).then(function (dataUrl) {
        state.draft.team[idx].photo = dataUrl;
        renderTeamForm();
      }).catch(function (err) {
        alert(err.message);
      });
    });
    const removeBtn = card.querySelector('.team-photo-remove');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        state.draft.team[idx].photo = null;
        renderTeamForm();
      });
    }
  });
}

function initTeamForm() {
  document.getElementById('addTeamBtn').addEventListener('click', function () {
    state.draft.team.push({ id: newId('t'), name: 'Nuevo doctor(a)', role: 'Especialidad', photo: null });
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

/* ---------- Sucursales ---------- */

function renderBranchesForm() {
  const list = document.getElementById('branchesList');
  list.innerHTML = (state.draft.branches || []).map(function (branch, idx) {
    return (
      '<div class="branch-admin-card" data-idx="' + idx + '">' +
        '<div class="branch-admin-head">' +
          '<input type="text" class="branch-name-input" value="' + escapeAttr(branch.name) + '" placeholder="Nombre de la sucursal">' +
          '<button class="btn-delete">Eliminar</button>' +
        '</div>' +
        '<div class="branch-fields">' +
          '<label>Dirección<input type="text" class="branch-address"></label>' +
          '<label>Horario Lun–Vie<input type="text" class="branch-hours-weekday"></label>' +
          '<label>Horario Sábado<input type="text" class="branch-hours-saturday"></label>' +
          '<label>Teléfono a mostrar<input type="text" class="branch-wa-display"></label>' +
          '<label>WhatsApp (solo dígitos, con código de país)<input type="text" class="branch-wa-phone" style="font-family:ui-monospace,monospace"></label>' +
          '<label>Correo<input type="text" class="branch-email"></label>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  list.querySelectorAll('.branch-admin-card').forEach(function (card) {
    const idx = Number(card.getAttribute('data-idx'));
    const branch = state.draft.branches[idx];
    card.querySelector('.branch-address').value = branch.address;
    card.querySelector('.branch-hours-weekday').value = branch.hoursWeekday;
    card.querySelector('.branch-hours-saturday').value = branch.hoursSaturday;
    card.querySelector('.branch-wa-display').value = branch.waPhoneDisplay;
    card.querySelector('.branch-wa-phone').value = branch.waPhone;
    card.querySelector('.branch-email').value = branch.email;

    card.querySelector('.branch-name-input').addEventListener('input', function (e) { branch.name = e.target.value; });
    card.querySelector('.branch-address').addEventListener('input', function (e) { branch.address = e.target.value; });
    card.querySelector('.branch-hours-weekday').addEventListener('input', function (e) { branch.hoursWeekday = e.target.value; });
    card.querySelector('.branch-hours-saturday').addEventListener('input', function (e) { branch.hoursSaturday = e.target.value; });
    card.querySelector('.branch-wa-display').addEventListener('input', function (e) { branch.waPhoneDisplay = e.target.value; });
    card.querySelector('.branch-wa-phone').addEventListener('input', function (e) { branch.waPhone = e.target.value; });
    card.querySelector('.branch-email').addEventListener('input', function (e) { branch.email = e.target.value; });
    card.querySelector('.btn-delete').addEventListener('click', function () {
      state.draft.branches.splice(idx, 1);
      renderBranchesForm();
    });
  });
}

function initBranchesForm() {
  document.getElementById('addBranchBtn').addEventListener('click', function () {
    state.draft.branches.push({
      id: newId('b'),
      name: 'Nueva sucursal',
      address: 'Dirección de la sucursal',
      hoursWeekday: 'Lun–Vie 9:00–19:00',
      hoursSaturday: 'Sáb 9:00–14:00',
      waPhone: '52XXXXXXXXXX',
      waPhoneDisplay: '+52 XXX XXX XXXX',
      email: 'sucursal@clinicasonrisa.example'
    });
    renderBranchesForm();
  });
  document.getElementById('saveBranchesBtn').addEventListener('click', function () {
    state.content.branches = JSON.parse(JSON.stringify(state.draft.branches));
    saveContent(state.content);
    flashSaved('sucursales');
  });
}

/* ---------- Init ---------- */

initLogin();
initHeroForm();
initServicesForm();
initTeamForm();
initTestimonialsForm();
initBranchesForm();
