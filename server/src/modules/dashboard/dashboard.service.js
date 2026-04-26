const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../../config/prisma');
const { startOfMonth, endOfMonth } = require('../../utils/dates');

const getSummary = async () => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in30 = new Date(today); in30.setDate(in30.getDate() + 30);

  const [incomeAgg, expenseAgg, upcoming, overdue, activeClients, activeServices] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.billingItem.aggregate({
      where: { status: { in: ['PLANNED', 'DUE'] }, dueDate: { gte: today, lte: in30 } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.billingItem.aggregate({
      where: { status: 'OVERDUE' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.client.count({ where: { status: 'ACTIVE' } }),
    prisma.service.count({ where: { status: 'ACTIVE' } }),
  ]);

  const income = Number(incomeAgg._sum.amount || 0);
  const expense = Number(expenseAgg._sum.amount || 0);

  return {
    currentMonthIncome: income,
    currentMonthExpense: expense,
    currentMonthProfit: income - expense,
    upcomingPaymentsCount: upcoming._count,
    upcomingPaymentsAmount: Number(upcoming._sum.amount || 0),
    overduePaymentsCount: overdue._count,
    overduePaymentsAmount: Number(overdue._sum.amount || 0),
    activeClientsCount: activeClients,
    activeServicesCount: activeServices,
  };
};

const getUpcomingPayments = async () => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
  return prisma.billingItem.findMany({
    where: { status: { in: ['PLANNED', 'DUE'] }, dueDate: { gte: today, lte: in30 } },
    orderBy: { dueDate: 'asc' },
    include: {
      client: { select: { id: true, name: true } },
      service: { select: { id: true, title: true } },
    },
  });
};

const getOverdue = async () =>
  prisma.billingItem.findMany({
    where: { status: 'OVERDUE' },
    orderBy: { dueDate: 'asc' },
    include: {
      client: { select: { id: true, name: true } },
      service: { select: { id: true, title: true } },
    },
  });

const getMonthlyChart = async () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ start: startOfMonth(d), end: endOfMonth(d), label: d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }) });
  }

  const data = await Promise.all(
    months.map(async ({ start, end, label }) => {
      const [inc, exp] = await Promise.all([
        prisma.transaction.aggregate({ where: { type: 'INCOME', date: { gte: start, lte: end } }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { type: 'EXPENSE', date: { gte: start, lte: end } }, _sum: { amount: true } }),
      ]);
      return {
        label,
        income: Number(inc._sum.amount || 0),
        expense: Number(exp._sum.amount || 0),
      };
    })
  );

  return data;
};

module.exports = { getSummary, getUpcomingPayments, getOverdue, getMonthlyChart };
