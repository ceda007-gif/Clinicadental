import { loadContent, submitAppointment, waLink, newId } from './content-store.js';
import { shapeIconSVG, checkLogoSVG, whatsappSVG } from './icons.js';

const content = await loadContent();

function branches() {
  return content.branches || [];
}

function findBranch(id) {
  return branches().find(function (b) { return b.id === id; }) || null;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function sectionVisible(key) {
  const vis = content.sectionVisibility || {};
  return vis[key] !== false;
}

function setSectionHidden(sectionId, navId, hidden) {
  const section = document.getElementById(sectionId);
  if (section) section.classList.toggle('hidden', hidden);
  const navLink = navId && document.getElementById(navId);
  if (navLink) navLink.classList.toggle('hidden', hidden);
}

function visibleItems(list) {
  return (list || []).filter(function (item) { return !item.hidden; });
}

function renderHeader() {
  document.getElementById('headerLogo').alt = content.clinicName;
  document.getElementById('footerBrandMark').innerHTML = checkLogoSVG('#ffffff', 18);
  document.getElementById('footerClinicName').textContent = content.clinicName;
}

function renderHero() {
  document.getElementById('heroEyebrow').textContent = content.hero.eyebrow;
  document.getElementById('heroTitle').textContent = content.hero.title;
  document.getElementById('heroSubtitle').textContent = content.hero.subtitle;

  const placeholder = document.getElementById('heroImagePlaceholder');
  if (content.heroImage) {
    placeholder.classList.add('has-photo');
    placeholder.innerHTML = '<img src="' + content.heroImage + '" alt="' + escapeHtml(content.clinicName) + '">';
  }
}

function renderServices() {
  setSectionHidden('servicios', 'navServicios', !sectionVisible('servicios'));

  const services = visibleItems(content.services);
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = services.map(function (item) {
    return (
      '<div class="service-card">' +
        '<div class="icon-tile">' + shapeIconSVG(item.shape, '#0284c7', 20) + '</div>' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<p>' + escapeHtml(item.desc) + '</p>' +
      '</div>'
    );
  }).join('');

  const select = document.getElementById('fieldServicio');
  services.forEach(function (item) {
    const opt = document.createElement('option');
    opt.value = item.title;
    opt.textContent = item.title;
    select.appendChild(opt);
  });
}

function renderWhyUs() {
  setSectionHidden('nosotros', 'navNosotros', !sectionVisible('nosotros'));

  const grid = document.getElementById('whyUsGrid');
  grid.innerHTML = visibleItems(content.whyUs).map(function (item) {
    return (
      '<div class="whyus-item">' +
        '<div class="icon-circle">' + shapeIconSVG(item.shape, '#0ea5e9', 20) + '</div>' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<p>' + escapeHtml(item.desc) + '</p>' +
      '</div>'
    );
  }).join('');
}

function renderTeam() {
  setSectionHidden('equipo', 'navEquipo', !sectionVisible('equipo'));

  const grid = document.getElementById('teamGrid');
  grid.innerHTML = visibleItems(content.team).map(function (item) {
    const photo = item.photo
      ? '<div class="team-photo has-photo"><img src="' + item.photo + '" alt="' + escapeHtml(item.name) + '"></div>'
      : '<div class="team-photo"><span>foto placeholder</span></div>';
    return (
      '<div class="team-card">' +
        photo +
        '<h3>' + escapeHtml(item.name) + '</h3>' +
        '<p>' + escapeHtml(item.role) + '</p>' +
      '</div>'
    );
  }).join('');
}

function renderGallery() {
  document.getElementById('gallerySubtitle').textContent = content.gallerySubtitle || '';
  const gallery = visibleItems(content.gallery);
  if (!sectionVisible('galeria') || !gallery.length) {
    setSectionHidden('galeria', 'navGaleria', true);
    return;
  }
  setSectionHidden('galeria', 'navGaleria', false);

  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = gallery.map(function (item, idx) {
    const caption = item.caption
      ? '<span class="gallery-item-caption">' + escapeHtml(item.caption) + '</span>'
      : '';
    return (
      '<button type="button" class="gallery-item" data-idx="' + idx + '">' +
        '<span class="gallery-item-photo"><img src="' + item.image + '" alt="' + escapeHtml(item.caption || content.clinicName) + '" loading="lazy"></span>' +
        caption +
      '</button>'
    );
  }).join('');

  grid.querySelectorAll('.gallery-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = gallery[Number(btn.getAttribute('data-idx'))];
      openLightbox(item);
    });
  });
}

function openLightbox(item) {
  const lightbox = document.getElementById('galleryLightbox');
  document.getElementById('lightboxImage').src = item.image;
  document.getElementById('lightboxImage').alt = item.caption || content.clinicName;
  const caption = document.getElementById('lightboxCaption');
  caption.textContent = item.caption || '';
  caption.classList.toggle('hidden', !item.caption);
  lightbox.classList.remove('hidden');
}

function closeLightbox() {
  document.getElementById('galleryLightbox').classList.add('hidden');
}

function setupLightbox() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('galleryLightbox').addEventListener('click', function (e) {
    if (e.target.id === 'galleryLightbox') closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeLightbox();
  });
}

function branchWaMessage(branch) {
  return 'Hola, quiero agendar una cita en ' + content.clinicName + ' (' + branch.name + ').';
}

function renderBranches() {
  setSectionHidden('sucursales', 'navSucursales', !sectionVisible('sucursales'));

  const grid = document.getElementById('branchesGrid');
  grid.innerHTML = branches().map(function (branch) {
    const link = waLink(branch.waPhone, branchWaMessage(branch));
    return (
      '<div class="branch-card">' +
        '<h3>' + escapeHtml(branch.name) + '</h3>' +
        '<p class="branch-address">' + escapeHtml(branch.address) + '</p>' +
        '<p class="branch-hours">' + escapeHtml(branch.hoursWeekday) + '<br>' + escapeHtml(branch.hoursSaturday) + '</p>' +
        '<a href="' + link + '" target="_blank" rel="noopener" class="btn btn-primary branch-wa-btn">' +
          whatsappSVG('#ffffff', 16) + ' ' + escapeHtml(branch.waPhoneDisplay) +
        '</a>' +
      '</div>'
    );
  }).join('');

  const contactList = document.getElementById('contactBranchesList');
  contactList.innerHTML = branches().map(function (branch) {
    const link = waLink(branch.waPhone, branchWaMessage(branch));
    return (
      '<a href="' + link + '" target="_blank" rel="noopener" class="contact-branch-btn">' +
        whatsappSVG('#0284c7', 16) +
        '<span>' + escapeHtml(branch.name) + '<small>' + escapeHtml(branch.waPhoneDisplay) + '</small></span>' +
      '</a>'
    );
  }).join('');

  const select = document.getElementById('fieldSucursal');
  branches().forEach(function (branch) {
    const opt = document.createElement('option');
    opt.value = branch.id;
    opt.textContent = branch.name;
    select.appendChild(opt);
  });
}

function renderTestimonials() {
  setSectionHidden('testimonios', 'navTestimonios', !sectionVisible('testimonios'));

  const grid = document.getElementById('testimonialsGrid');
  grid.innerHTML = visibleItems(content.testimonials).map(function (item) {
    return (
      '<div class="testimonial-card">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" style="margin-bottom:12px"><path d="M7 10c0-2.8 2.2-5 5-5v3c-1.1 0-2 .9-2 2h2v5H7v-5Zm9 0c0-2.8 2.2-5 5-5v3c-1.1 0-2 .9-2 2h2v5h-5v-5Z" fill="#0ea5e9"></path></svg>' +
        '<p class="quote">&ldquo;' + escapeHtml(item.quote) + '&rdquo;</p>' +
        '<p class="name">' + escapeHtml(item.name) + '</p>' +
      '</div>'
    );
  }).join('');
}

function renderFooterInfo() {
  const container = document.getElementById('footerBranches');
  container.innerHTML = branches().map(function (branch) {
    return (
      '<div class="col">' +
        '<h4>' + escapeHtml(branch.name) + '</h4>' +
        '<p>' + escapeHtml(branch.address) + '<br><br>' +
          escapeHtml(branch.hoursWeekday) + '<br>' + escapeHtml(branch.hoursSaturday) + '<br><br>' +
          escapeHtml(branch.waPhoneDisplay) + '<br>' + escapeHtml(branch.email) +
        '</p>' +
      '</div>'
    );
  }).join('');

  document.getElementById('footerCopyright').textContent =
    '© ' + new Date().getFullYear() + ' ' + content.clinicName + ' · Datos de sucursales de ejemplo — actualízalos con la información real.';
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  const sucursalSelect = document.getElementById('fieldSucursal');
  const nombreInput = document.getElementById('fieldNombre');
  const telefonoInput = document.getElementById('fieldTelefono');
  const servicioSelect = document.getElementById('fieldServicio');
  const mensajeInput = document.getElementById('fieldMensaje');
  const errorSucursal = document.getElementById('errorSucursal');
  const errorNombre = document.getElementById('errorNombre');
  const errorTelefono = document.getElementById('errorTelefono');
  const successMsg = document.getElementById('formSuccess');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const sucursalId = sucursalSelect.value;
    const nombre = nombreInput.value;
    const telefono = telefonoInput.value;
    const servicio = servicioSelect.value;
    const mensaje = mensajeInput.value;
    const branch = findBranch(sucursalId);

    let hasError = false;
    if (!branch) {
      errorSucursal.textContent = 'Selecciona una sucursal';
      errorSucursal.classList.remove('hidden');
      hasError = true;
    } else {
      errorSucursal.classList.add('hidden');
    }
    if (!nombre.trim()) {
      errorNombre.textContent = 'Ingresa tu nombre';
      errorNombre.classList.remove('hidden');
      hasError = true;
    } else {
      errorNombre.classList.add('hidden');
    }
    if (!telefono.trim()) {
      errorTelefono.textContent = 'Ingresa tu teléfono';
      errorTelefono.classList.remove('hidden');
      hasError = true;
    } else {
      errorTelefono.classList.add('hidden');
    }
    if (hasError) {
      successMsg.classList.add('hidden');
      return;
    }

    const lines = [
      'Hola, quiero agendar una cita en ' + content.clinicName + ' (' + branch.name + ').',
      'Nombre: ' + nombre,
      'Teléfono: ' + telefono
    ];
    if (servicio) lines.push('Servicio de interés: ' + servicio);
    if (mensaje.trim()) lines.push('Mensaje: ' + mensaje.trim());

    await submitAppointment({
      id: newId('a'),
      branchId: branch.id,
      sucursalNombre: branch.name,
      nombre: nombre,
      telefono: telefono,
      servicio: servicio,
      mensaje: mensaje,
      createdAt: new Date().toISOString(),
      status: 'nuevo'
    });

    window.open(waLink(branch.waPhone, lines.join('\n')), '_blank');
    successMsg.classList.remove('hidden');
  });
}

renderHeader();
renderHero();
renderServices();
renderWhyUs();
renderTeam();
renderGallery();
renderBranches();
renderTestimonials();
renderFooterInfo();
setupContactForm();
setupLightbox();
