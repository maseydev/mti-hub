const { z } = require('zod');
const prisma = require('../../config/prisma');
const { NotFoundError, AppError } = require('../../utils/errors');
const { ensureClientCanBeLinked } = require('../../utils/projects');

const projectSchema = z.object({
  clientId: z.string().min(1, 'Укажите клиента'),
  name: z.string().min(1, 'Укажите название'),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED']).optional(),
  startDate: z.string().datetime({ offset: true }).optional().nullable().or(z.literal('')),
  endDate: z.string().datetime({ offset: true }).optional().nullable().or(z.literal('')),
  repositoryUrl: z.string().url().optional().nullable().or(z.literal('')),
  productionUrl: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});

const include = {
  client: { select: { id: true, name: true } },
  _count: { select: { services: true, billingItems: true } },
};

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.status) where.status = filters.status;
  return prisma.project.findMany({ where, orderBy: { createdAt: 'desc' }, include });
};

const getById = async (id) => {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      services: { orderBy: { nextDueDate: 'asc' } },
      billingItems: { orderBy: { dueDate: 'desc' }, take: 20 },
    },
  });
  if (!project) throw new NotFoundError('Проект не найден');
  return project;
};

const coerceDate = (v) => (v === '' || v === null || v === undefined ? null : new Date(v));

const create = async (data) => {
  const parsed = projectSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { startDate, endDate, repositoryUrl, productionUrl, ...rest } = parsed.data;
  await ensureClientCanBeLinked(prisma, rest.clientId);
  return prisma.project.create({
    data: {
      ...rest,
      startDate: coerceDate(startDate),
      endDate: coerceDate(endDate),
      repositoryUrl: repositoryUrl || null,
      productionUrl: productionUrl || null,
    },
    include,
  });
};

const update = async (id, data) => {
  const current = await getById(id);
  const parsed = projectSchema.partial().safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { startDate, endDate, repositoryUrl, productionUrl, ...rest } = parsed.data;
  const nextClientId = rest.clientId === undefined ? current.clientId : rest.clientId;
  if (nextClientId !== current.clientId) {
    await ensureClientCanBeLinked(prisma, nextClientId);
  }
  return prisma.project.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate !== undefined ? { startDate: coerceDate(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: coerceDate(endDate) } : {}),
      ...(repositoryUrl !== undefined ? { repositoryUrl: repositoryUrl || null } : {}),
      ...(productionUrl !== undefined ? { productionUrl: productionUrl || null } : {}),
    },
    include,
  });
};

const remove = async (id) => {
  await getById(id);
  return prisma.project.update({ where: { id }, data: { status: 'ARCHIVED' } });
};

module.exports = { getAll, getById, create, update, remove };
