import { loadContent, addAppointment, waLink, newId } from './content-store.js';
import { shapeIconSVG, checkLogoSVG, whatsappSVG } from './icons.js';

const content = loadContent();

function heroMessage() {
  return 'Hola, quiero agendar una cita en ' + content.clinicName + '.';
}

function renderHeader() {
  document.getElementById('brandMark').innerHTML = checkLogoSVG('#ffffff', 20);
  document.getElementById('footerBrandMark').innerHTML = checkLogoSVG('#ffffff', 18);
  document.getElementById('clinicName').textContent = content.clinicName;
  document.getElementById('footerClinicName').textContent = content.clinicName;

  const link = waLink(content.waPhone, heroMessage());
  document.getElementById('headerCta').href = link;
  document.getElementById('heroWaCta').href = link;
  document.getElementById('contactWaCta').href = link;
  document.getElementById('footerWaCta').href = link;
  document.getElementById('heroWaIcon').innerHTML = whatsappSVG('#ffffff', 18);
  document.getElementById('contactWaIcon').innerHTML = whatsappSVG('#0284c7', 18);
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
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = (content.services || []).map(function (item) {
    return (
      '<div class="service-card">' +
        '<div class="icon-tile">' + shapeIconSVG(item.shape, '#0284c7', 20) + '</div>' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<p>' + escapeHtml(item.desc) + '</p>' +
      '</div>'
    );
  }).join('');

  const select = document.getElementById('fieldServicio');
  (content.services || []).forEach(function (item) {
    const opt = document.createElement('option');
    opt.value = item.title;
    opt.textContent = item.title;
    select.appendChild(opt);
  });
}

function renderWhyUs() {
  const grid = document.getElementById('whyUsGrid');
  grid.innerHTML = (content.whyUs || []).map(function (item) {
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
  const grid = document.getElementById('teamGrid');
  grid.innerHTML = (content.team || []).map(function (item) {
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

function renderTestimonials() {
  const grid = document.getElementById('testimonialsGrid');
  grid.innerHTML = (content.testimonials || []).map(function (item) {
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
  document.getElementById('footerAddress').innerHTML =
    escapeHtml(content.address) + '<br><br>' + escapeHtml(content.hoursWeekday) + '<br>' + escapeHtml(content.hoursSaturday);
  document.getElementById('footerContact').innerHTML =
    escapeHtml(content.waPhoneDisplay) + '<br>' + escapeHtml(content.email);
  document.getElementById('waPhoneDisplayContact').textContent = content.waPhoneDisplay;
  document.getElementById('footerCopyright').textContent =
    '© ' + new Date().getFullYear() + ' ' + content.clinicName + ' · Datos de contacto de ejemplo — actualízalos con la información real.';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function setupContactForm() {
  const form = document.getElementById('contactForm');
  const nombreInput = document.getElementById('fieldNombre');
  const telefonoInput = document.getElementById('fieldTelefono');
  const servicioSelect = document.getElementById('fieldServicio');
  const mensajeInput = document.getElementById('fieldMensaje');
  const errorNombre = document.getElementById('errorNombre');
  const errorTelefono = document.getElementById('errorTelefono');
  const successMsg = document.getElementById('formSuccess');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nombre = nombreInput.value;
    const telefono = telefonoInput.value;
    const servicio = servicioSelect.value;
    const mensaje = mensajeInput.value;

    let hasError = false;
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
      'Hola, quiero agendar una cita en ' + content.clinicName + '.',
      'Nombre: ' + nombre,
      'Teléfono: ' + telefono
    ];
    if (servicio) lines.push('Servicio de interés: ' + servicio);
    if (mensaje.trim()) lines.push('Mensaje: ' + mensaje.trim());

    addAppointment({
      id: newId('a'),
      nombre: nombre,
      telefono: telefono,
      servicio: servicio,
      mensaje: mensaje,
      createdAt: new Date().toISOString(),
      status: 'nuevo'
    });

    window.open(waLink(content.waPhone, lines.join('\n')), '_blank');
    successMsg.classList.remove('hidden');
  });
}

renderHeader();
renderHero();
renderServices();
renderWhyUs();
renderTeam();
renderTestimonials();
renderFooterInfo();
setupContactForm();
