require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Starting...');

  // Default admin user
  const passwordHash = await argon2.hash('admin123');
  await prisma.user.upsert({
    where: { email: 'admin@studio.ru' },
    update: {},
    create: { email: 'admin@studio.ru', passwordHash, name: 'Администратор', role: 'OWNER' },
  });
  console.log('[seed] User: admin@studio.ru / admin123');

  // Income categories
  const incomeCategories = [
    { name: 'Разработка', color: '#409EFF' },
    { name: 'Хостинг', color: '#67C23A' },
    { name: 'Обслуживание', color: '#E6A23C' },
    { name: 'Доработки', color: '#F56C6C' },
    { name: 'Консультации', color: '#909399' },
    { name: 'Прочее', color: '#C0C4CC' },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: { id: `sys-income-${cat.name}` },
      update: { color: cat.color },
      create: { id: `sys-income-${cat.name}`, name: cat.name, type: 'INCOME', color: cat.color, isSystem: true },
    });
  }

  // Expense categories
  const expenseCategories = [
    { name: 'Серверы', color: '#F56C6C' },
    { name: 'Домены', color: '#E6A23C' },
    { name: 'Подрядчики', color: '#409EFF' },
    { name: 'Реклама', color: '#9B59B6' },
    { name: 'ПО и лицензии', color: '#1ABC9C' },
    { name: 'Налоги', color: '#E74C3C' },
    { name: 'Прочее', color: '#C0C4CC' },
  ];

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: { id: `sys-expense-${cat.name}` },
      update: { color: cat.color },
      create: { id: `sys-expense-${cat.name}`, name: cat.name, type: 'EXPENSE', color: cat.color, isSystem: true },
    });
  }
  console.log('[seed] Categories created');

  // Demo client
  const client = await prisma.client.upsert({
    where: { id: 'demo-client-1' },
    update: {},
    create: {
      id: 'demo-client-1',
      name: 'ООО Ромашка',
      contactName: 'Иван Иванов',
      email: 'ivan@romashka.ru',
      phone: '+7 900 000-00-01',
      companyName: 'ООО «Ромашка»',
      status: 'ACTIVE',
    },
  });

  // Demo project
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      clientId: client.id,
      name: 'Корпоративный сайт',
      description: 'Разработка корпоративного сайта на Vue.js',
      status: 'ACTIVE',
      productionUrl: 'https://romashka.ru',
    },
  });

  // Demo service
  const nextDue = new Date();
  nextDue.setDate(1);
  nextDue.setMonth(nextDue.getMonth() + 1);
  nextDue.setHours(0, 0, 0, 0);

  await prisma.service.upsert({
    where: { id: 'demo-service-1' },
    update: {},
    create: {
      id: 'demo-service-1',
      clientId: client.id,
      projectId: project.id,
      title: 'Хостинг корпоративного сайта',
      type: 'HOSTING',
      billingCycle: 'MONTHLY',
      amount: 1500,
      currency: 'RUB',
      nextDueDate: nextDue,
      status: 'ACTIVE',
    },
  });
  console.log('[seed] Demo client, project, service created');

  // Demo transactions
  const hostingCat = await prisma.category.findFirst({ where: { name: 'Хостинг', type: 'INCOME' } });
  const devCat = await prisma.category.findFirst({ where: { name: 'Разработка', type: 'INCOME' } });
  const serverCat = await prisma.category.findFirst({ where: { name: 'Серверы', type: 'EXPENSE' } });

  const txs = [
    { id: 'demo-tx-1', type: 'INCOME', amount: 45000, description: 'Оплата разработки — ООО Ромашка', categoryId: devCat?.id, clientId: client.id, daysAgo: 10 },
    { id: 'demo-tx-2', type: 'INCOME', amount: 1500, description: 'Хостинг — ноябрь', categoryId: hostingCat?.id, clientId: client.id, daysAgo: 5 },
    { id: 'demo-tx-3', type: 'EXPENSE', amount: 3200, description: 'VPS сервер — Timeweb', categoryId: serverCat?.id, daysAgo: 3 },
  ];

  for (const { id, type, amount, description, categoryId, clientId, daysAgo } of txs) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    await prisma.transaction.upsert({
      where: { id },
      update: {},
      create: { id, type, amount, currency: 'RUB', date, description, categoryId, clientId: clientId || null },
    });
  }
  console.log('[seed] Demo transactions created');

  // Telegram settings stub
  await prisma.telegramSettings.upsert({
    where: { id: 'default-telegram' },
    update: {},
    create: { id: 'default-telegram', isEnabled: false, reminderDaysBefore: [7, 3, 1, 0], overdueReminderEnabled: true },
  });

  console.log('[seed] Done ✓');
}

main()
  .catch((err) => { console.error('[seed] Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
