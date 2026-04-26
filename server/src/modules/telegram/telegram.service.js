const { z } = require('zod');
const axios = require('axios');
const prisma = require('../../config/prisma');
const { AppError, NotFoundError } = require('../../utils/errors');

const settingsSchema = z.object({
  chatId: z.string().optional().nullable(),
  isEnabled: z.boolean().optional(),
  reminderDaysBefore: z.array(z.number().int().min(0)).optional(),
  overdueReminderEnabled: z.boolean().optional(),
});

const botSchema = z.object({
  botToken: z.string().optional(),
  botUsername: z.string().optional().nullable(),
  isEnabled: z.boolean().optional(),
});

const mySettingsSchema = z.object({
  telegramChatId: z.string().optional().nullable(),
  taskNotificationsEnabled: z.boolean().optional(),
  financeNotificationsEnabled: z.boolean().optional(),
});

// --- Finance reminder settings (global) ---

const getOrCreateSettings = async () => {
  let settings = await prisma.telegramSettings.findFirst();
  if (!settings) settings = await prisma.telegramSettings.create({ data: {} });
  return settings;
};

const getSettings = async () => getOrCreateSettings();

const updateSettings = async (data) => {
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const settings = await getOrCreateSettings();
  return prisma.telegramSettings.update({ where: { id: settings.id }, data: parsed.data });
};

// --- Bot token management ---

const getBots = async () => {
  const bots = await prisma.telegramBotSettings.findMany({ orderBy: { type: 'asc' } });
  return bots.map((b) => ({ ...b, botToken: b.botToken ? '***' : '' }));
};

const getBotRaw = async (type) => {
  const bot = await prisma.telegramBotSettings.findUnique({ where: { type } });
  return bot;
};

const updateBot = async (type, data) => {
  const parsed = botSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  return prisma.telegramBotSettings.upsert({
    where: { type },
    update: parsed.data,
    create: { type, ...parsed.data },
    select: { id: true, type: true, botUsername: true, isEnabled: true, updatedAt: true },
  });
};

// --- Send helpers ---

const sendViaBot = async (botType, chatId, text) => {
  const bot = await getBotRaw(botType);
  if (!bot || !bot.botToken) throw new AppError(`Токен бота ${botType} не настроен`);
  const url = `https://api.telegram.org/bot${bot.botToken}/sendMessage`;
  const response = await axios.post(url, { chat_id: chatId, text, parse_mode: 'HTML' });
  return response.data;
};

const sendMessage = async (chatId, text, botType = 'FINANCE') => {
  return sendViaBot(botType, chatId, text);
};

const testBot = async (type, chatId) => {
  if (!chatId) throw new AppError('Укажите chat_id для теста');
  return sendViaBot(type, chatId, `✅ <b>MTI-HUB</b>\n\nТест бота ${type} — работает корректно.`);
};

// Legacy test for global chatId
const sendTest = async () => {
  const settings = await getOrCreateSettings();
  if (!settings.chatId) throw new AppError('chatId не настроен в настройках Telegram');
  return sendMessage(settings.chatId, '✅ <b>MTI-HUB</b>\n\nТестовое сообщение — Telegram работает корректно.', 'FINANCE');
};

// --- User personal settings ---

const getMySettings = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true, taskNotificationsEnabled: true, financeNotificationsEnabled: true },
  });
  if (!user) throw new NotFoundError('Пользователь не найден');
  return user;
};

const updateMySettings = async (userId, data) => {
  const parsed = mySettingsSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  return prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { telegramChatId: true, taskNotificationsEnabled: true, financeNotificationsEnabled: true },
  });
};

const testMyTask = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true, name: true },
  });
  if (!user?.telegramChatId) throw new AppError('Ваш Telegram Chat ID не настроен. Укажите его в настройках.');
  return sendViaBot('TASK', user.telegramChatId, `✅ <b>MTI-HUB</b>\n\nПривет, ${user.name}! Тест уведомлений о задачах работает.`);
};

module.exports = {
  getSettings, updateSettings,
  getBots, updateBot, testBot, sendTest,
  sendMessage, sendViaBot,
  getMySettings, updateMySettings, testMyTask,
};
