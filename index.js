require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { Bot } = require('./models');
const { fork } = require('child_process');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3131;

function createBotProcess(bot) {
  const botProcess = fork(path.join(__dirname, 'botInstance.js'), [bot.token, bot.name, bot.return_url]);

  botProcess.on('error', (err) => {
    console.error(`Error in bot process ${bot.name}:`, err);
  });

  botProcess.on('exit', (code, signal) => {
    console.log(`Bot process ${bot.name} exited with code ${code} and signal ${signal}`);
  });
}

async function initializeBots() {
  const botList = await Bot.findAll();
  botList.forEach((bot) => {
    createBotProcess(bot);
    console.log(`Bot ${bot.name} process started.`);
  });
}

initializeBots();

app.get('/', async (req, res) => {
  res.send('Welcom to berimo.ir - Bale messenger assistant :) ')
});

app.post('/register-bot', async (req, res) => {
  const { name, token, return_url } = req.body;

  if (!name || !token || !return_url) {
    return res.status(400).json({ error: 'نام، توکن و Return URL الزامی هستند.' });
  }

  try {
    const bot = await Bot.create({
      name,
      token,
      return_url,
    });

    createBotProcess(bot);

    res.json({ uuid: bot.uuid });
  } catch (error) {
    console.error('Error registering bot:', error);
    res.status(500).json({ error: 'خطا در ثبت ربات.' });
  }
});

app.post('/send-message', async (req, res) => {
  const { bot_uuid, chat_id, text } = req.body;

  if (!bot_uuid || !chat_id || !text) {
    return res.status(400).json({ error: 'bot_uuid، chat_id و متن پیام الزامی هستند.' });
  }

  try {
    const bot = await Bot.findOne({ where: { uuid: bot_uuid } });

    if (!bot) {
      console.error(`Bot with UUID ${bot_uuid} not found.`);
      return res.status(404).json({ error: 'ربات مورد نظر یافت نشد.' });
    }

    const API_URL = `https://tapi.bale.ai/bot${bot.token}`;

    await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chat_id,
      text: text,
    });

    console.log(`Message sent to ${chat_id} via bot ${bot.name}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'خطا در ارسال پیام.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});