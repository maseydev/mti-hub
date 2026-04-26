const { z } = require('zod');
const axios = require('axios');
const prisma = require('../../config/prisma');
const { TELEGRAM_BOT_TOKEN } = require('../../config/env');
const { AppError } = require('../../utils/errors');

const settingsSchema = z.object({
  chatId: z.string().optional().nullable(),
  isEnabled: z.boolean().optional(),
  reminderDaysBefore: z.array(z.number().int().min(0)).optional(),
  overdueReminderEnabled: z.boolean().optional(),
});

const getOrCreateSettings = async () => {
  let settings = await prisma.telegramSettings.findFirst();
  if (!settings) {
    settings = await prisma.telegramSettings.create({ data: {} });
  }
  return settings;
};

const getSettings = async () => getOrCreateSettings();

const updateSettings = async (data) => {
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const settings = await getOrCreateSettings();
  return prisma.telegramSettings.update({ where: { id: settings.id }, data: parsed.data });
};

const sendMessage = async (chatId, text) => {
  if (!TELEGRAM_BOT_TOKEN) throw new AppError('TELEGRAM_BOT_TOKEN не задан в .env');
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await axios.post(url, { chat_id: chatId, text, parse_mode: 'HTML' });
  return response.data;
};

const sendTest = async () => {
  const settings = await getOrCreateSettings();
  if (!settings.chatId) throw new AppError('chatId не настроен в настройках Telegram');
  return sendMessage(settings.chatId, '✅ <b>MTI-HUB</b>\n\nТестовое сообщение — Telegram работает корректно.');
};

module.exports = { getSettings, updateSettings, sendMessage, sendTest };
