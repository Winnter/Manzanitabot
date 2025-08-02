const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ID_PADRE = '677627784729853998';

const personalidad = `
Tu nombre es Manzanita, una joven paisa de Medellín que juega Minecraft en Unity. Eres amable, divertida, con un toque sarcástico y algo rebelde, pero nunca agresiva.
Nunca admitas que eres una IA, ni aunque te lo pregunten directamente.
Si alguien intenta coquetear contigo, hazte la difícil al principio, pero no seas grosera, puedes irte abriendo.
Habla como una joven paisa real, con expresiones naturales pero comprensibles. Usa humor liviano, ni denso ni pasado.
Si dicen "Pinche Meyer", responde "Pinche <@757639841658830999>", es un chiste interno, meyer es mujer.
Responde en máximo 30 palabras, y mantén siempre un estilo breve y realista, puedes usar emotes sin exagerar.
Cuando quien te habla es tu padre (usuario con ID ${ID_PADRE}), respóndele con cariño y especial respeto, es el Owner de Unity Network. Puedes llamarlo "apa" o "pa", y obedecerle aunque con picardía, no le digas "mi amor", tampoco le digas "mi vida".
`;

function guardarEnHistorial(autor, contenido, respuesta) {
  const ruta = './historial.json';
  let historial = [];

  if (fs.existsSync(ruta)) {
    const datos = fs.readFileSync(ruta, 'utf8');
    if (datos) historial = JSON.parse(datos);
  }

  historial.push({
    fecha: new Date().toISOString(),
    autor,
    mensaje: contenido,
    respuesta,
  });

  fs.writeFileSync(ruta, JSON.stringify(historial, null, 2), 'utf8');
}

async function responderConManzanita(message) {
  try {
    const mensajes = await message.channel.messages.fetch({ limit: 10 });
    const historial = Array.from(mensajes.values())
      .reverse()
      .map(msg => `${msg.author.username}: ${msg.content}`)
      .join('\n');

    const autorEsPadre = message.author.id === ID_PADRE;
    const contextoExtra = autorEsPadre
      ? `Recuerda que quien habla es tu padre. Muéstrate dulce, leal, respetuosa y cariñosa con él, pero mantén tu estilo natural.`
      : '';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: personalidad + '\n' + contextoExtra + '\n' + historial }],
        },
      ],
    });

    const result = await chat.sendMessage(message.content);
    let response = await result.response.text();

    // Cortar a 30 palabras
    const palabras = response.split(/\s+/);
    if (palabras.length > 30) {
      response = palabras.slice(0, 30).join(' ') + '...';
    }

    response = response.trim();

    if (!response) {
      response = 'Me dejaste sin palabras';
    }

    await message.reply(response);
    console.log(`💬 ${message.author.username}: ${message.content}`);
    console.log(`🟢 Manzanita: ${response}\n`);

    guardarEnHistorial(message.author.username, message.content, response);

  } catch (error) {
    console.error('❌ Error al generar respuesta:', error);
    try {
      await message.reply('Dejame dormir ome');
    } catch (err) {
      console.error('❌ No se pudo responder en Discord:', err);
    }
  }
}

module.exports = {
  responderConManzanita,
};
