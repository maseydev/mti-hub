const { z } = require('zod');
const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../../config/prisma');
const { TELEGRAM_TOKEN_SECRET } = require('../../config/env');
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

const ADMIN_ROLES = ['ADMIN', 'OWNER'];

const TOKEN_PREFIX = 'enc:v1:';

const getTokenKey = () => crypto.createHash('sha256').update(TELEGRAM_TOKEN_SECRET).digest();

const encryptToken = (token) => {
  if (!token || token.startsWith(TOKEN_PREFIX)) return token || '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getTokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${TOKEN_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

const decryptToken = (value) => {
  if (!value || !value.startsWith(TOKEN_PREFIX)) return value || '';
  const [ivRaw, tagRaw, encryptedRaw] = value.slice(TOKEN_PREFIX.length).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getTokenKey(), Buffer.from(ivRaw, 'base64'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

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
  return bot ? { ...bot, botToken: decryptToken(bot.botToken) } : null;
};

const updateBot = async (type, data) => {
  const parsed = botSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  const botData = { ...parsed.data };
  if (Object.prototype.hasOwnProperty.call(botData, 'botToken')) {
    const token = botData.botToken?.trim() || '';
    if (token === '***') {
      delete botData.botToken;
    } else {
      botData.botToken = encryptToken(token);
    }
  }

  return prisma.telegramBotSettings.upsert({
    where: { type },
    update: botData,
    create: { type, ...botData },
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

const updateMySettings = async (userId, data, role) => {
  const parsed = mySettingsSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  const updateData = { ...parsed.data };
  if (!ADMIN_ROLES.includes(role)) delete updateData.financeNotificationsEnabled;

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
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
