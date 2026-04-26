const cron = require('node-cron');
const prisma = require('../config/prisma');
const telegramSvc = require('../modules/telegram/telegram.service');
const { formatDateRu } = require('../utils/dates');
const { formatAmount } = require('../utils/money');

const buildKey = (type, billingItemId) => `${type}:${billingItemId}`;

const wasAlreadySent = async (reminderType, billingItemId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const log = await prisma.notificationLog.findFirst({
    where: {
      reminderType,
      billingItemId,
      sentAt: { gte: today, lt: tomorrow },
      status: 'SENT',
    },
  });
  return !!log;
};

const logNotification = async (reminderType, billingItemId, status, errorMessage = null) => {
  await prisma.notificationLog.create({
    data: { reminderType, billingItemId, status, errorMessage },
  });
};

const runReminders = async () => {
  const settings = await prisma.telegramSettings.findFirst();
  if (!settings || !settings.isEnabled || !settings.chatId) return;

  const daysBefore = Array.isArray(settings.reminderDaysBefore) ? settings.reminderDaysBefore : [7, 3, 1, 0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const days of daysBefore) {
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + days);
    const targetEnd = new Date(targetDate);
    targetEnd.setHours(23, 59, 59, 999);

    const items = await prisma.billingItem.findMany({
      where: {
        dueDate: { gte: targetDate, lte: targetEnd },
        status: { in: ['PLANNED', 'DUE'] },
      },
      include: { client: { select: { name: true } } },
    });

    for (const item of items) {
      const type = `upcoming_${days}d`;
      if (await wasAlreadySent(type, item.id)) continue;

      const text = `🔔 Напоминание: клиент <b>${item.client?.name || '—'}</b> должен оплатить «${item.title}» до ${formatDateRu(item.dueDate)}. Сумма: ${formatAmount(item.amount, item.currency)}.`;

      try {
        await telegramSvc.sendMessage(settings.chatId, text);
        await logNotification(type, item.id, 'SENT');
      } catch (err) {
        await logNotification(type, item.id, 'FAILED', err.message);
      }
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

      try {
        await telegramSvc.sendMessage(settings.chatId, text);
        await logNotification(type, item.id, 'SENT');
      } catch (err) {
        await logNotification(type, item.id, 'FAILED', err.message);
      }
    }
  }
};

const start = () => {
  // Daily at 09:00
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
