const { z } = require('zod');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../../config/prisma');
const { NotFoundError, AppError } = require('../../utils/errors');
const { ensureProjectCanBeLinked } = require('../../utils/projects');

const txSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive('Сумма должна быть больше 0'),
  currency: z.string().default('RUB'),
  date: z.string().min(1, 'Укажите дату'),
  categoryId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const include = {
  category: { select: { id: true, name: true, color: true } },
  client: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  account: { select: { id: true, name: true } },
};

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.type) where.type = filters.type;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.accountId) where.accountId = filters.accountId;
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
  }
  return prisma.transaction.findMany({ where, orderBy: { date: 'desc' }, include });
};

const getById = async (id) => {
  const tx = await prisma.transaction.findUnique({ where: { id }, include });
  if (!tx) throw new NotFoundError('Транзакция не найдена');
  return tx;
};

const create = async (data) => {
  const parsed = txSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { amount, date, ...rest } = parsed.data;
  await ensureProjectCanBeLinked(prisma, rest.projectId, rest.clientId);
  return prisma.transaction.create({
    data: { ...rest, amount: new Decimal(amount), date: new Date(date) },
    include,
  });
};

const update = async (id, data) => {
  const current = await getById(id);
  const parsed = txSchema.partial().safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { amount, date, ...rest } = parsed.data;
  const nextProjectId = rest.projectId === undefined ? current.projectId : rest.projectId;
  const nextClientId = rest.clientId === undefined ? current.clientId : rest.clientId;
  if (nextProjectId !== current.projectId || nextClientId !== current.clientId) {
    await ensureProjectCanBeLinked(prisma, nextProjectId, nextClientId);
  }
  return prisma.transaction.update({
    where: { id },
    data: {
      ...rest,
      ...(amount !== undefined ? { amount: new Decimal(amount) } : {}),
      ...(date !== undefined ? { date: new Date(date) } : {}),
    },
    include,
  });
};

const remove = async (id) => {
  const tx = await getById(id);
  if (tx.billingItemId) throw new AppError('Нельзя удалить транзакцию, привязанную к счёту. Сначала отмените счёт.');
  return prisma.transaction.delete({ where: { id } });
};

module.exports = { getAll, getById, create, update, remove };
