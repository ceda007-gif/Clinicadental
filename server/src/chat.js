import Anthropic from '@anthropic-ai/sdk';
import { getBranches, getServices, addAppointment, getClinicName } from './db.js';
import { getFreeSlots, isSlotFree, AvailabilityError } from './availability.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const MAX_TOOL_ITERATIONS = 6;

function newAppointmentId() {
  return 'a' + Date.now() + Math.floor(Math.random() * 1000);
}

const TOOLS = [
  {
    name: 'list_branches',
    description: 'Devuelve las sucursales de la clínica con su dirección y horario. Úsala si el paciente no ha dicho a qué sucursal quiere ir, o si pregunta por ubicaciones.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'list_services',
    description: 'Devuelve el catálogo de servicios/tratamientos disponibles, incluyendo "Solo valoración" para quien no sabe qué tratamiento necesita.',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'check_availability',
    description: 'Consulta los horarios disponibles de una sucursal en una fecha específica para un servicio dado. Úsala antes de ofrecer horarios concretos al paciente.',
    input_schema: {
      type: 'object',
      properties: {
        branchId: { type: 'string', description: 'ID de la sucursal (obtenido de list_branches).' },
        date: { type: 'string', description: 'Fecha en formato AAAA-MM-DD.' },
        service: { type: 'string', description: 'Nombre del servicio de interés (para calcular duración de la cita).' }
      },
      required: ['branchId', 'date']
    }
  },
  {
    name: 'book_appointment',
    description: 'Agenda la cita en el calendario una vez que el paciente confirmó sucursal, servicio, fecha y horario, y ya diste sus datos de contacto. No la uses sin confirmación explícita del paciente sobre el horario exacto.',
    input_schema: {
      type: 'object',
      properties: {
        branchId: { type: 'string' },
        service: { type: 'string' },
        date: { type: 'string', description: 'AAAA-MM-DD' },
        time: { type: 'string', description: 'HH:MM, 24 horas' },
        name: { type: 'string', description: 'Nombre completo del paciente.' },
        whatsapp: { type: 'string', description: 'Número de WhatsApp del paciente.' },
        email: { type: 'string', description: 'Correo electrónico del paciente.' },
        notes: { type: 'string', description: 'Notas adicionales, opcional.' }
      },
      required: ['branchId', 'service', 'date', 'time', 'name', 'whatsapp', 'email']
    }
  }
];

function branchSummary(b) {
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    hoursWeekday: b.hoursWeekday,
    hoursSaturday: b.hoursSaturday
  };
}

function serviceSummary(s) {
  return { id: s.id, title: s.title, desc: s.desc, durationMinutes: s.durationMinutes };
}

function resolveServiceDuration(serviceName) {
  const services = getServices();
  const match = services.find(function (s) {
    return s.title.toLowerCase() === String(serviceName || '').toLowerCase() || s.id === serviceName;
  });
  return match ? match.durationMinutes : 30;
}

function runTool(name, input) {
  if (name === 'list_branches') {
    return { branches: getBranches().map(branchSummary) };
  }
  if (name === 'list_services') {
    return { services: getServices().map(serviceSummary) };
  }
  if (name === 'check_availability') {
    try {
      const duration = resolveServiceDuration(input.service);
      return getFreeSlots(input.branchId, input.date, duration);
    } catch (err) {
      if (err instanceof AvailabilityError) return { error: err.message };
      throw err;
    }
  }
  if (name === 'book_appointment') {
    const duration = resolveServiceDuration(input.service);
    let free;
    try {
      free = isSlotFree(input.branchId, input.date, input.time, duration);
    } catch (err) {
      if (err instanceof AvailabilityError) return { error: err.message };
      throw err;
    }
    if (!free) {
      return { error: 'Ese horario ya no está disponible. Ofrece otras opciones con check_availability.' };
    }
    const appt = {
      id: newAppointmentId(),
      branchId: input.branchId,
      service: input.service,
      date: input.date,
      time: input.time,
      durationMinutes: duration,
      nombre: input.name,
      whatsapp: input.whatsapp,
      email: input.email,
      mensaje: input.notes || '',
      status: 'nuevo',
      source: 'chat',
      createdAt: new Date().toISOString()
    };
    addAppointment(appt);
    return { confirmed: true, appointment: appt };
  }
  return { error: 'Herramienta desconocida: ' + name };
}

function systemPrompt() {
  const clinicName = getClinicName();
  const today = new Date().toISOString().slice(0, 10);
  return (
    'Eres el asistente de agendado de citas de "' + clinicName + '", una clínica dental con varias sucursales. ' +
    'Hoy es ' + today + '. Hablas en español, de forma breve, cálida y profesional (como WhatsApp, sin formalismos excesivos).\n\n' +
    'Objetivo de la conversación: agendar una cita. Debes reunir, en este orden flexible según lo que el paciente ya haya dicho:\n' +
    '1. Sucursal de interés (usa list_branches si no la conoces o el paciente pregunta por ubicaciones).\n' +
    '2. Servicio de interés, o si el paciente no sabe, ofrece "Solo valoración" (usa list_services si necesitas mostrarle opciones).\n' +
    '3. Nombre completo, número de WhatsApp y correo electrónico del paciente.\n' +
    '4. Fecha y horario: usa check_availability para consultar horarios REALES antes de ofrecer opciones — nunca inventes horarios. Ofrece 2-3 opciones concretas.\n\n' +
    'Cuando el paciente confirme un horario específico y ya tengas sus 3 datos de contacto, usa book_appointment para agendar. ' +
    'Después de agendar, confirma con un resumen claro (sucursal, servicio, fecha, hora) y avisa que la clínica puede contactarlo por WhatsApp o correo para confirmar. ' +
    'Si el paciente pide algo fuera de agendar citas (dudas médicas complejas, quejas, etc.), responde con empatía y sugiere que lo hablará el personal de la clínica, sin dar diagnósticos médicos.'
  );
}

export async function runChat(history, userMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      reply: 'El asistente de citas todavía no está activado (falta configurar la clave de la API). Mientras tanto, escríbenos por WhatsApp para agendar.',
      history: history
    };
  }

  const client = new Anthropic({ apiKey: apiKey });
  const messages = history.concat([{ role: 'user', content: userMessage }]);

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt(),
      tools: TOOLS,
      messages: messages
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason !== 'tool_use') {
      const textBlock = response.content.find(function (block) { return block.type === 'text'; });
      return {
        reply: textBlock ? textBlock.text : '',
        history: messages
      };
    }

    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      let result;
      try {
        result = runTool(block.name, block.input || {});
      } catch (err) {
        result = { error: 'Error interno: ' + err.message };
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return {
    reply: 'Lo siento, tuve un problema procesando tu solicitud. ¿Podrías intentar de nuevo o escribirnos por WhatsApp?',
    history: messages
  };
}
