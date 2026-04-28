const { z } = require('zod');
const { Decimal } = require('@prisma/client/runtime/library');
const prisma = require('../../config/prisma');
const { NotFoundError, AppError } = require('../../utils/errors');
const { today, addCycleToDate, monthNameRu } = require('../../utils/dates');
const { ensureProjectCanBeLinked } = require('../../utils/projects');

const itemInclude = {
  client: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  service: { select: { id: true, title: true, billingCycle: true } },
};

const itemSchema = z.object({
  clientId: z.string().min(1, 'Укажите клиента'),
  projectId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  title: z.string().min(1, 'Укажите название'),
  amount: z.coerce.number().positive('Сумма должна быть больше 0'),
  currency: z.string().default('RUB'),
  dueDate: z.string().min(1, 'Укажите дату'),
  notes: z.string().optional().nullable(),
});

const getItems = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.dateFrom || filters.dateTo) {
    where.dueDate = {};
    if (filters.dateFrom) where.dueDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.dueDate.lte = new Date(filters.dateTo);
  }
  return prisma.billingItem.findMany({
    where,
    orderBy: { dueDate: 'asc' },
    include: itemInclude,
  });
};

const getItemById = async (id) => {
  const item = await prisma.billingItem.findUnique({ where: { id }, include: itemInclude });
  if (!item) throw new NotFoundError('Счёт не найден');
  return item;
};

const createItem = async (data) => {
  const parsed = itemSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { amount, dueDate, ...rest } = parsed.data;
  await ensureProjectCanBeLinked(prisma, rest.projectId, rest.clientId);
  const due = new Date(dueDate);
  const now = today();
  let status = 'PLANNED';
  if (due < now) status = 'OVERDUE';
  else if (due.toDateString() === now.toDateString()) status = 'DUE';

  return prisma.billingItem.create({
    data: { ...rest, amount: new Decimal(amount), dueDate: due, status, source: 'MANUAL' },
    include: itemInclude,
  });
};

const updateItem = async (id, data) => {
  const current = await getItemById(id);
  const parsed = itemSchema.partial().safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { amount, dueDate, ...rest } = parsed.data;
  const nextProjectId = rest.projectId === undefined ? current.projectId : rest.projectId;
  const nextClientId = rest.clientId === undefined ? current.clientId : rest.clientId;
  if (nextProjectId !== current.projectId || nextClientId !== current.clientId) {
    await ensureProjectCanBeLinked(prisma, nextProjectId, nextClientId);
  }
  return prisma.billingItem.update({
    where: { id },
    data: {
      ...rest,
      ...(amount !== undefined ? { amount: new Decimal(amount) } : {}),
      ...(dueDate !== undefined ? { dueDate: new Date(dueDate) } : {}),
    },
    include: itemInclude,
  });
};

const markPaid = async (id, body = {}) => {
  const item = await getItemById(id);
  if (item.status === 'PAID') throw new AppError('Счёт уже оплачен');
  if (item.status === 'CANCELLED') throw new AppError('Счёт отменён');

  const paidAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.billingItem.update({ where: { id }, data: { status: 'PAID', paidAt } });

    const existingTx = await tx.transaction.findUnique({ where: { billingItemId: id } });
    if (!existingTx) {
      await tx.transaction.create({
        data: {
          type: 'INCOME',
          amount: item.amount,
          currency: item.currency,
          date: paidAt,
          clientId: item.clientId,
          projectId: item.projectId,
          serviceId: item.serviceId,
          billingItemId: id,
          description: item.title,
        },
      });
    }

    if (item.serviceId) {
      const service = await tx.service.findUnique({ where: { id: item.serviceId } });
      if (service) {
        const newNextDueDate = addCycleToDate(service.nextDueDate, service.billingCycle);
        await tx.service.update({ where: { id: item.serviceId }, data: { nextDueDate: newNextDueDate } });
      }
    }
  });

  return getItemById(id);
};

const generateFromServices = async () => {
  const services = await prisma.service.findMany({
    where: { status: 'ACTIVE' },
    include: { client: { select: { id: true, name: true } } },
  });

  const now = today();
  let created = 0;
  let skipped = 0;

  for (const service of services) {
    const dueDate = new Date(service.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);

    let status = 'PLANNED';
    if (dueDate < now) status = 'OVERDUE';
    else if (dueDate.toDateString() === now.toDateString()) status = 'DUE';

    const title = `${service.title} — ${monthNameRu(dueDate)}`;

    try {
      await prisma.billingItem.upsert({
        where: { serviceId_dueDate: { serviceId: service.id, dueDate } },
        create: {
          clientId: service.clientId,
          projectId: service.projectId,
          serviceId: service.id,
          title,
          amount: service.amount,
          currency: service.currency,
          dueDate,
          status,
          source: 'SERVICE_AUTO',
        },
        update: {
          status,
          title,
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  return { created, skipped, total: services.length };
};

const updateOverdueStatuses = async () => {
  const now = today();
  const result = await prisma.billingItem.updateMany({
    where: {
      dueDate: { lt: now },
      status: { notIn: ['PAID', 'CANCELLED'] },
    },
    data: { status: 'OVERDUE' },
  });
  return result.count;
};

module.exports = { getItems, getItemById, createItem, updateItem, markPaid, generateFromServices, updateOverdueStatuses };
