import { getBranch, getAppointments } from './db.js';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const BOOKING_BUFFER_MINUTES = 60;

function toMinutes(hhmm) {
  const parts = hhmm.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function toHHMM(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function isValidDate(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !Number.isNaN(new Date(dateStr + 'T00:00:00').getTime());
}

export class AvailabilityError extends Error {}

export function getFreeSlots(branchId, dateStr, durationMinutes) {
  if (!isValidDate(dateStr)) {
    throw new AvailabilityError('Fecha inválida, usa formato AAAA-MM-DD.');
  }
  const branch = getBranch(branchId);
  if (!branch) {
    throw new AvailabilityError('Sucursal no encontrada.');
  }
  const duration = Number(durationMinutes) || branch.slotMinutes || 30;
  const day = new Date(dateStr + 'T00:00:00');
  const dayKey = DAY_KEYS[day.getDay()];
  const hours = branch.schedule && branch.schedule[dayKey];
  if (!hours) {
    return { branch: branch.name, date: dateStr, open: false, slots: [] };
  }

  const openMin = toMinutes(hours.open);
  const closeMin = toMinutes(hours.close);
  const step = branch.slotMinutes || 30;

  const existing = getAppointments({ branchId: branch.id, date: dateStr })
    .filter(function (a) { return a.status !== 'cancelado'; })
    .map(function (a) {
      const start = toMinutes(a.time);
      return { start: start, end: start + (a.durationMinutes || step) };
    });

  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = [];
  for (let start = openMin; start + duration <= closeMin; start += step) {
    if (isToday && start < nowMinutes + BOOKING_BUFFER_MINUTES) continue;
    const end = start + duration;
    const overlaps = existing.some(function (e) { return start < e.end && end > e.start; });
    if (!overlaps) slots.push(toHHMM(start));
  }

  return { branch: branch.name, date: dateStr, open: true, slots: slots };
}

export function isSlotFree(branchId, dateStr, timeStr, durationMinutes) {
  const result = getFreeSlots(branchId, dateStr, durationMinutes);
  return result.open && result.slots.indexOf(timeStr) !== -1;
}
