const cron = require('node-cron');
const prisma = require('../config/prisma');
const telegramSvc = require('../modules/telegram/telegram.service');
const { formatDateRu } = require('../utils/dates');
const { formatAmount } = require('../utils/money');

const wasAlreadySent = async (reminderType, billingItemId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const log = await prisma.notificationLog.findFirst({
    where: { reminderType, billingItemId, sentAt: { gte: today, lt: tomorrow }, status: 'SENT' },
  });
  return !!log;
};

const logNotification = async (reminderType, billingItemId, status, errorMessage = null) => {
  await prisma.notificationLog.create({ data: { reminderType, billingItemId, status, errorMessage } });
};

const getFinanceRecipients = async () => {
  const settings = await prisma.telegramSettings.findFirst();
  const chatIds = new Set();

  // Global chatId from legacy settings
  if (settings?.chatId) chatIds.add(settings.chatId);

  // Per-user chatIds for users with finance notifications enabled
  const users = await prisma.user.findMany({
    where: { isActive: true, financeNotificationsEnabled: true, telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  for (const u of users) if (u.telegramChatId) chatIds.add(u.telegramChatId);

  return { settings, chatIds: [...chatIds] };
};

const broadcastFinance = async (chatIds, text, billingItemId, reminderType) => {
  let sentCount = 0;
  let failedCount = 0;

  for (const chatId of chatIds) {
    try {
      await telegramSvc.sendMessage(chatId, text, 'FINANCE');
      sentCount += 1;
    } catch (err) {
      failedCount += 1;
      await logNotification(reminderType, billingItemId, 'FAILED', err.message);
    }
  }

  if (sentCount > 0) {
    await logNotification(reminderType, billingItemId, 'SENT', failedCount ? `${failedCount} recipient(s) failed` : null);
  }
};

const runReminders = async () => {
  const { settings, chatIds } = await getFinanceRecipients();
  if (!settings || !settings.isEnabled || chatIds.length === 0) return;

  const daysBefore = Array.isArray(settings.reminderDaysBefore) ? settings.reminderDaysBefore : [7, 3, 1, 0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const days of daysBefore) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetEnd = new Date(targetDate);
    targetEnd.setHours(23, 59, 59, 999);

    const items = await prisma.billingItem.findMany({
      where: { dueDate: { gte: targetDate, lte: targetEnd }, status: { in: ['PLANNED', 'DUE'] } },
      include: { client: { select: { name: true } } },
    });

    for (const item of items) {
      const type = `upcoming_${days}d`;
      if (await wasAlreadySent(type, item.id)) continue;

      const text = `🔔 Напоминание: клиент <b>${item.client?.name || '—'}</b> должен оплатить «${item.title}» до ${formatDateRu(item.dueDate)}. Сумма: ${formatAmount(item.amount, item.currency)}.`;
      await broadcastFinance(chatIds, text, item.id, type);
    }
  }

  if (settings.overdueReminderEnabled) {
    const overdueItems = await prisma.billingItem.findMany({
      where: { status: 'OVERDUE' },
      include: { client: { select: { name: true } } },
    });

    for (const item of overdueItems) {
      const type = 'overdue';
      if (await wasAlreadySent(type, item.id)) continue;

      const text = `🚨 Просрочка: клиент <b>${item.client?.name || '—'}</b> не оплатил «${item.title}». Дата оплаты была ${formatDateRu(item.dueDate)}. Сумма: ${formatAmount(item.amount, item.currency)}.`;
      await broadcastFinance(chatIds, text, item.id, type);
    }
  }
};

const start = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[reminders.job] Running...');
    try {
      await runReminders();
      console.log('[reminders.job] Done');
    } catch (err) {
      console.error('[reminders.job] Error:', err.message);
    }
  });

  console.log('[reminders.job] Scheduled (daily 09:00)');
};

module.exports = { start, runReminders };
