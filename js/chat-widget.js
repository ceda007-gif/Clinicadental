import { API_BASE } from './config.js';
import { loadContent, waLink } from './content-store.js';
import { chatSVG } from './icons.js';

const content = await loadContent();

let history = [];
let sending = false;
let backendAvailable = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

// Renders the subset of WhatsApp-style formatting the assistant tends to use:
// **bold** / *bold* → <strong>, _italic_ → <em>. Runs on already-escaped text,
// so the markers themselves can't inject HTML.
function formatMessage(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?:^|\s)\*(\S(?:[^*]*?\S)?)\*(?=[\s.,;:!?)]|$)/g, function (match, inner) {
      return match.replace('*' + inner + '*', '<strong>' + inner + '</strong>');
    })
    .replace(/(?:^|\s)_(\S(?:[^_]*?\S)?)_(?=[\s.,;:!?)]|$)/g, function (match, inner) {
      return match.replace('_' + inner + '_', '<em>' + inner + '</em>');
    })
    .replace(/\n/g, '<br>');
}

function firstBranchWaLink() {
  const branch = (content.branches || [])[0];
  if (!branch) return null;
  return waLink(branch.waPhone, 'Hola, quiero agendar una cita en ' + content.clinicName + '.');
}

function appendMessage(role, text) {
  const messages = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'chat-msg chat-msg-' + role;
  el.innerHTML = formatMessage(text);
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
  return el;
}

function appendTyping() {
  const messages = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'chat-msg chat-msg-assistant chat-typing';
  el.id = 'chatTyping';
  el.innerHTML = '<span></span><span></span><span></span>';
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('chatTyping');
  if (el) el.remove();
}

// Keeps the "typing…" indicator up for roughly how long a person would take
// to type the reply (a bit faster than average, so it stays natural without
// feeling slow), but never adds extra wait on top of a response that was
// already slow for other reasons (e.g. a rate-limit retry).
const TYPING_MS_PER_CHAR = 18;
const TYPING_MIN_MS = 600;
const TYPING_MAX_MS = 3500;

function wait(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function waitForTypingEffect(text, sinceTimestamp) {
  const target = Math.min(TYPING_MAX_MS, Math.max(TYPING_MIN_MS, String(text || '').length * TYPING_MS_PER_CHAR));
  const remaining = target - (Date.now() - sinceTimestamp);
  return remaining > 0 ? wait(remaining) : Promise.resolve();
}

async function checkBackend() {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch(API_BASE + '/api/health', { method: 'GET' });
    backendAvailable = res.ok;
  } catch (e) {
    backendAvailable = false;
  }
  return backendAvailable;
}

async function openChat() {
  const panel = document.getElementById('chatPanel');
  const wasHidden = panel.classList.contains('hidden');
  panel.classList.remove('hidden');
  if (!wasHidden) return;

  const messages = document.getElementById('chatMessages');
  if (messages.childElementCount > 0) return;

  const available = await checkBackend();
  if (available) {
    appendMessage('assistant', '¡Hola! Soy el asistente de citas de ' + content.clinicName + '. Puedo ayudarte a elegir sucursal, servicio y horario. ¿En qué te ayudo?');
    document.getElementById('chatInput').disabled = false;
  } else {
    const link = firstBranchWaLink();
    const linkHtml = link ? ' Mientras tanto, puedes escribirnos por <a href="' + link + '" target="_blank" rel="noopener">WhatsApp</a>.' : '';
    const el = appendMessage('assistant', 'El asistente de citas todavía no está activado en este sitio.');
    el.innerHTML += linkHtml;
    document.getElementById('chatInput').disabled = true;
  }
}

function closeChat() {
  document.getElementById('chatPanel').classList.add('hidden');
}

async function sendMessage(text) {
  if (sending) return;
  sending = true;
  appendMessage('user', text);
  appendTyping();
  const startedAt = Date.now();

  try {
    const res = await fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: history })
    });
    const data = await res.json();
    if (!res.ok) {
      removeTyping();
      appendMessage('assistant', data.error || 'Ocurrió un error, intenta de nuevo.');
    } else {
      history = data.history || history;
      const reply = data.reply || '...';
      await waitForTypingEffect(reply, startedAt);
      removeTyping();
      appendMessage('assistant', reply);
    }
  } catch (e) {
    removeTyping();
    appendMessage('assistant', 'No pude conectar con el asistente. Intenta de nuevo en un momento.');
  } finally {
    sending = false;
  }
}

function init() {
  document.getElementById('chatToggleIcon').innerHTML = chatSVG('#ffffff', 24);
  document.getElementById('chatToggle').addEventListener('click', openChat);
  document.getElementById('chatClose').addEventListener('click', closeChat);
  document.getElementById('chatInput').disabled = true;

  document.getElementById('chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendMessage(text);
  });
}

init();
