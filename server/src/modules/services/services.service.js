const { z } = require('zod');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../../config/prisma');
const { NotFoundError, AppError } = require('../../utils/errors');

const serviceSchema = z.object({
  clientId: z.string().min(1, 'Укажите клиента'),
  projectId: z.string().optional().nullable(),
  title: z.string().min(1, 'Укажите название'),
  description: z.string().optional().nullable(),
  type: z.enum(['HOSTING', 'DOMAIN', 'MAINTENANCE', 'SERVER', 'LICENSE', 'SUPPORT', 'OTHER']),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_YEARLY', 'YEARLY']),
  amount: z.coerce.number().positive('Сумма должна быть больше 0'),
  currency: z.string().default('RUB'),
  nextDueDate: z.string().min(1, 'Укажите дату следующей оплаты'),
  startDate: z.string().optional().nullable().or(z.literal('')),
  endDate: z.string().optional().nullable().or(z.literal('')),
  autoCreateIncome: z.boolean().default(true),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'ARCHIVED']).optional(),
  notes: z.string().optional().nullable(),
});

const include = {
  client: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
};

const buildWhere = (filters) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.projectId) where.projectId = filters.projectId;

  const now = new Date();
  if (filters.dueSoon === 'true' || filters.dueSoon === true) {
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    where.nextDueDate = { lte: in30 };
    where.status = 'ACTIVE';
  }
  if (filters.overdue === 'true' || filters.overdue === true) {
    where.nextDueDate = { lt: now };
    where.status = 'ACTIVE';
  }
  return where;
};

const getAll = async (filters = {}) =>
  prisma.service.findMany({ where: buildWhere(filters), orderBy: { nextDueDate: 'asc' }, include });

const getById = async (id) => {
  const s = await prisma.service.findUnique({ where: { id }, include });
  if (!s) throw new NotFoundError('Услуга не найдена');
  return s;
};

const coerceDate = (v) => (v === '' || v == null ? null : new Date(v));

const create = async (data) => {
  const parsed = serviceSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { amount, nextDueDate, startDate, endDate, ...rest } = parsed.data;
  return prisma.service.create({
    data: {
      ...rest,
      amount: new Decimal(amount),
      nextDueDate: new Date(nextDueDate),
      startDate: coerceDate(startDate),
      endDate: coerceDate(endDate),
    },
    include,
  });
};

const update = async (id, data) => {
  await getById(id);
  const parsed = serviceSchema.partial().safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { amount, nextDueDate, startDate, endDate, ...rest } = parsed.data;
  return prisma.service.update({
    where: { id },
    data: {
      ...rest,
      ...(amount !== undefined ? { amount: new Decimal(amount) } : {}),
      ...(nextDueDate !== undefined ? { nextDueDate: new Date(nextDueDate) } : {}),
      ...(startDate !== undefined ? { startDate: coerceDate(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: coerceDate(endDate) } : {}),
    },
    include,
  });
};

const remove = async (id) => {
  await getById(id);
  return prisma.service.update({ where: { id }, data: { status: 'ARCHIVED' } });
};

const pause = async (id) => {
  const s = await getById(id);
  if (s.status !== 'ACTIVE') throw new AppError('Можно приостановить только активную услугу');
  return prisma.service.update({ where: { id }, data: { status: 'PAUSED' }, include });
};

const resume = async (id) => {
  const s = await getById(id);
  if (s.status !== 'PAUSED') throw new AppError('Можно возобновить только приостановленную услугу');
  return prisma.service.update({ where: { id }, data: { status: 'ACTIVE' }, include });
};

module.exports = { getAll, getById, create, update, remove, pause, resume };
