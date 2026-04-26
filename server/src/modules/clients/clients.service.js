const { z } = require('zod');
const prisma = require('../../config/prisma');
const { NotFoundError, AppError } = require('../../utils/errors');

const clientSchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  contactName: z.string().optional().nullable(),
  email: z.string().email('Некорректный email').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
});

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { companyName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.client.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { projects: true, services: true, billingItems: true } },
    },
  });
};

const getById = async (id) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: { orderBy: { createdAt: 'desc' } },
      services: { orderBy: { nextDueDate: 'asc' } },
      billingItems: { orderBy: { dueDate: 'desc' }, take: 20 },
      transactions: { orderBy: { date: 'desc' }, take: 20, include: { category: true, account: true } },
      _count: { select: { projects: true, services: true, billingItems: true, transactions: true } },
    },
  });
  if (!client) throw new NotFoundError('Клиент не найден');
  return client;
};

const create = async (data) => {
  const parsed = clientSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { email, ...rest } = parsed.data;
  return prisma.client.create({ data: { ...rest, email: email || null } });
};

const update = async (id, data) => {
  await getById(id);
  const parsed = clientSchema.partial().safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { email, ...rest } = parsed.data;
  return prisma.client.update({
    where: { id },
    data: { ...rest, ...(email !== undefined ? { email: email || null } : {}) },
  });
};

const remove = async (id) => {
  await getById(id);
  return prisma.client.update({ where: { id }, data: { status: 'ARCHIVED' } });
};

module.exports = { getAll, getById, create, update, remove };
