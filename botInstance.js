// botInstance.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// دریافت آرگومان‌ها از خط فرمان
const botToken = process.argv[2];
const botName = process.argv[3];
const returnUrl = process.argv[4];

if (!botToken || !botName || !returnUrl) {
    console.error('Bot token, name, and return URL are required.');
    process.exit(1);
}

const API_URL = `https://tapi.bale.ai/bot${botToken}`;

// مسیر فایل برای ذخیره offset مربوط به این ربات
const offsetFilePath = path.join(__dirname, `offset_${botName}.txt`);

// تابع برای بارگذاری offset از فایل
function loadOffset() {
    try {
        const data = fs.readFileSync(offsetFilePath, 'utf8');
        return parseInt(data, 10);
    } catch (error) {
        return 0;
    }
}

// تابع برای ذخیره offset در فایل
function saveOffset(newOffset) {
    fs.writeFileSync(offsetFilePath, newOffset.toString());
}

let offset = loadOffset();

// ایجاد شیء برای ذخیره زمان آخرین ارسال پیام به هر chat_id
const lastSentTimes = {};

async function pollUpdates() {
    try {
        const response = await axios.post(`${API_URL}/getUpdates`, {
            offset: offset,
            timeout: 10, // مدت زمان انتظار سرور (در ثانیه)
        });

        const updates = response.data.result;

        // اگر آپدیتی دریافت شد
        if (updates.length > 0) {
            for (const update of updates) {
                // پردازش آپدیت
                await handleUpdate(update);

                // به‌روزرسانی offset
                offset = update.update_id + 1;
                saveOffset(offset);
            }
        }
    } catch (error) {
        console.error('Error in polling updates:', error.response ? error.response.data : error.message);
    } finally {
        // زمان‌بندی برای درخواست بعدی
        setTimeout(pollUpdates, 1000); // هر 1 ثانیه درخواست جدید می‌فرستد
    }
}

async function handleUpdate(update) {
    const message = update.message;
    if (message) {
        const chatId = message.chat.id;

        if (message.text === '/start') {
            // ارسال لینک به کاربر
            const linkWithChatId = `${returnUrl}?refer_id=${chatId}`;
            const messageText = `برای ادامه فعالسازی بله، لطفاً روی لینک زیر کلیک کنید:\n${linkWithChatId}`;

            await sendMessage(chatId, messageText);
        } else {
            // سایر پیام‌ها
            await sendMessage(chatId, 'لطفاً روی لینک ارسال شده کلیک کنید.');
        }
    }
}

async function sendMessage(chatId, text) {
    const now = Date.now();
    const lastSent = lastSentTimes[chatId] || 0;

    // بررسی اینکه آیا ۱۵ ثانیه از آخرین ارسال پیام گذشته است یا خیر
    if (now - lastSent < 15000) { // 15000 میلی‌ثانیه = ۱۵ ثانیه
        console.log(`Message to ${chatId} throttled (only ${((now - lastSent) / 1000).toFixed(1)} seconds since last message).`);
        return;
    }

    // به‌روزرسانی زمان آخرین ارسال پیام به این chat_id
    lastSentTimes[chatId] = now;

    try {
        await axios.post(`${API_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
        });
        console.log(`Message sent to ${chatId} by bot ${botName}`);
    } catch (error) {
        console.error(`Error sending message to ${chatId}:`, error.response ? error.response.data : error.message);
    }
}

// شروع پولینگ
pollUpdates();