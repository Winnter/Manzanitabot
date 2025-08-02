// index.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { responderConManzanita } = require('./gemini');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`✅ Manzanita está conectada como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  console.log(`📨 ${message.author.username}: ${message.content}`); // Mostrar mensajes en consola

  const esMencionDirecta = message.mentions.has(client.user);
  const esReply = message.type === 19 && message.mentions.repliedUser?.id === client.user.id;
  const contieneNombre = message.content.toLowerCase().includes('manzanita');

  if (esMencionDirecta || esReply || contieneNombre) {
    await responderConManzanita(message);
  }
});

client.login(process.env.DISCORD_TOKEN);
