const { z } = require('zod');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../../config/prisma');
const { NotFoundError, AppError } = require('../../utils/errors');

const accountSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  type: z.enum(['CASH', 'BANK', 'CARD', 'CRYPTO', 'OTHER']),
  currency: z.string().default('RUB'),
  openingBalance: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

const computeBalance = async (id, openingBalance) => {
  const agg = await prisma.transaction.groupBy({
    by: ['type'],
    where: { accountId: id },
    _sum: { amount: true },
  });
  let income = new Decimal(0);
  let expense = new Decimal(0);
  for (const row of agg) {
    if (row.type === 'INCOME') income = row._sum.amount || new Decimal(0);
    if (row.type === 'EXPENSE') expense = row._sum.amount || new Decimal(0);
  }
  return new Decimal(openingBalance).plus(income).minus(expense);
};

const getAll = async () => {
  const accounts = await prisma.account.findMany({ orderBy: { createdAt: 'asc' } });
  return Promise.all(
    accounts.map(async (a) => ({
      ...a,
      balance: (await computeBalance(a.id, a.openingBalance)).toNumber(),
    }))
  );
};

const getById = async (id) => {
  const a = await prisma.account.findUnique({ where: { id } });
  if (!a) throw new NotFoundError('Счёт не найден');
  return { ...a, balance: (await computeBalance(id, a.openingBalance)).toNumber() };
};

const create = async (data) => {
  const parsed = accountSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { openingBalance, ...rest } = parsed.data;
  const a = await prisma.account.create({
    data: { ...rest, openingBalance: new Decimal(openingBalance) },
  });
  return { ...a, balance: Number(a.openingBalance) };
};

const update = async (id, data) => {
  await getById(id);
  const parsed = accountSchema.partial().safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { openingBalance, ...rest } = parsed.data;
  const a = await prisma.account.update({
    where: { id },
    data: {
      ...rest,
      ...(openingBalance !== undefined ? { openingBalance: new Decimal(openingBalance) } : {}),
    },
  });
  return { ...a, balance: (await computeBalance(id, a.openingBalance)).toNumber() };
};

const remove = async (id) => {
  await getById(id);
  const usage = await prisma.transaction.count({ where: { accountId: id } });
  if (usage > 0) throw new AppError(`Счёт используется в ${usage} транзакциях`);
  return prisma.account.delete({ where: { id } });
};

module.exports = { getAll, getById, create, update, remove };
