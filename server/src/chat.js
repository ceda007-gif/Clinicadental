import { GoogleGenAI } from '@google/genai';
import { getBranches, getServices, addAppointment, getClinicName, getAssistantInstructions } from './db.js';
import { getFreeSlots, isSlotFree, AvailabilityError } from './availability.js';

// Free-tier rate limits (and model availability) are tracked per model, so
// when one is saturated or unavailable, jumping to the next gives it its own
// separate quota instead of waiting out the same one. Order = preference.
// gemini-flash-latest goes first — it's the one confirmed working live;
// the pinned versions behind it are extra fallback quota, not replacements.
const MODELS = Array.from(new Set([
  process.env.GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
].filter(Boolean)));

const MAX_TOOL_ITERATIONS = 6;

function newAppointmentId() {
  return 'a' + Date.now() + Math.floor(Math.random() * 1000);
}

const TOOLS = [
  {
    name: 'list_branches',
    description: 'Devuelve las sucursales de la clínica con su dirección y horario. Úsala si el paciente no ha dicho a qué sucursal quiere ir, o si pregunta por ubicaciones.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'list_services',
    description: 'Devuelve el catálogo de servicios/tratamientos disponibles, incluyendo "Solo valoración" para quien no sabe qué tratamiento necesita.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'check_availability',
    description: 'Consulta los horarios disponibles de una sucursal en una fecha específica para un servicio dado. Úsala antes de ofrecer horarios concretos al paciente.',
    parameters: {
      type: 'OBJECT',
      properties: {
        branchId: { type: 'STRING', description: 'ID de la sucursal (obtenido de list_branches).' },
        date: { type: 'STRING', description: 'Fecha en formato AAAA-MM-DD.' },
        service: { type: 'STRING', description: 'Nombre del servicio de interés (para calcular duración de la cita).' }
      },
      required: ['branchId', 'date']
    }
  },
  {
    name: 'book_appointment',
    description: 'Agenda la cita en el calendario una vez que el paciente confirmó sucursal, servicio, fecha y horario, y ya diste sus datos de contacto. No la uses sin confirmación explícita del paciente sobre el horario exacto.',
    parameters: {
      type: 'OBJECT',
      properties: {
        branchId: { type: 'STRING' },
        service: { type: 'STRING' },
        date: { type: 'STRING', description: 'AAAA-MM-DD' },
        time: { type: 'STRING', description: 'HH:MM, 24 horas' },
        name: { type: 'STRING', description: 'Nombre completo del paciente.' },
        whatsapp: { type: 'STRING', description: 'Número de WhatsApp del paciente.' },
        email: { type: 'STRING', description: 'Correo electrónico del paciente.' },
        notes: { type: 'STRING', description: 'Notas adicionales, opcional.' }
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

async function resolveServiceDuration(serviceName) {
  const services = await getServices();
  const match = services.find(function (s) {
    return s.title.toLowerCase() === String(serviceName || '').toLowerCase() || s.id === serviceName;
  });
  return match ? match.durationMinutes : 30;
}

async function runTool(name, input) {
  if (name === 'list_branches') {
    return { branches: (await getBranches()).map(branchSummary) };
  }
  if (name === 'list_services') {
    return { services: (await getServices()).map(serviceSummary) };
  }
  if (name === 'check_availability') {
    try {
      const duration = await resolveServiceDuration(input.service);
      return await getFreeSlots(input.branchId, input.date, duration);
    } catch (err) {
      if (err instanceof AvailabilityError) return { error: err.message };
      throw err;
    }
  }
  if (name === 'book_appointment') {
    const duration = await resolveServiceDuration(input.service);
    let free;
    try {
      free = await isSlotFree(input.branchId, input.date, input.time, duration);
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
    await addAppointment(appt);
    return { confirmed: true, appointment: appt };
  }
  return { error: 'Herramienta desconocida: ' + name };
}

async function systemPrompt() {
  const clinicName = await getClinicName();
  const today = new Date().toISOString().slice(0, 10);
  const customInstructions = await getAssistantInstructions();

  let prompt = (
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

  if (customInstructions.trim()) {
    prompt += (
      '\n\nInstrucciones adicionales del negocio (síguelas para el tono, promociones, políticas u ' +
      'otras reglas propias de esta clínica — pero nunca dejes de usar check_availability antes de ' +
      'ofrecer horarios, ni inventes disponibilidad):\n' + customInstructions.trim()
    );
  }

  return prompt;
}

function isQuotaError(err) {
  return Boolean(err) && (err.status === 429 || /RESOURCE_EXHAUSTED/.test(String(err.message || '')));
}

function isModelUnavailableError(err) {
  return Boolean(err) && (err.status === 404 || /NOT_FOUND/.test(String(err.message || '')));
}

// Free-tier quota (and model availability) is tracked per model, so on a 429
// or "model not found", jump straight to the next model in MODELS instead of
// waiting out the same one's limit — it has its own separate quota. Only
// bails out immediately on errors a different model wouldn't fix (bad key,
// malformed request, etc.).
async function generateWithFallback(client, baseParams) {
  let lastErr = null;
  for (const model of MODELS) {
    try {
      return await client.models.generateContent(Object.assign({}, baseParams, { model: model }));
    } catch (err) {
      lastErr = err;
      if (isQuotaError(err) || isModelUnavailableError(err)) continue;
      throw err;
    }
  }
  throw lastErr;
}

export async function runChat(history, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      reply: 'El asistente de citas todavía no está activado (falta configurar la clave de la API). Mientras tanto, escríbenos por WhatsApp para agendar.',
      history: history
    };
  }

  const client = new GoogleGenAI({ apiKey: apiKey });
  const contents = history.concat([{ role: 'user', parts: [{ text: userMessage }] }]);
  const instructions = await systemPrompt();

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await generateWithFallback(client, {
        contents: contents,
        config: {
          systemInstruction: instructions,
          tools: [{ functionDeclarations: TOOLS }]
        }
      });

      const candidateContent = response.candidates && response.candidates[0] && response.candidates[0].content;
      const parts = (candidateContent && candidateContent.parts) || [];
      contents.push({ role: 'model', parts: parts });

      const functionCalls = response.functionCalls;
      if (!functionCalls || !functionCalls.length) {
        return {
          reply: response.text || '',
          history: contents
        };
      }

      const responseParts = await Promise.all(functionCalls.map(async function (call) {
        let result;
        try {
          result = await runTool(call.name, call.args || {});
        } catch (err) {
          result = { error: 'Error interno: ' + err.message };
        }
        return {
          functionResponse: {
            id: call.id,
            name: call.name,
            response: result
          }
        };
      }));
      contents.push({ role: 'user', parts: responseParts });
    }
  } catch (err) {
    console.error('chat error', err);
    if (isQuotaError(err)) {
      return {
        reply: 'Ahora mismo tengo muchas solicitudes de golpe. Espera unos segundos e intenta de nuevo, o escríbenos por WhatsApp si es urgente.',
        history: history
      };
    }
    return {
      reply: 'Tuve un problema para procesar tu mensaje. Intenta de nuevo en un momento, o escríbenos por WhatsApp.',
      history: history
    };
  }

  return {
    reply: 'Lo siento, tuve un problema procesando tu solicitud. ¿Podrías intentar de nuevo o escribirnos por WhatsApp?',
    history: contents
  };
}
