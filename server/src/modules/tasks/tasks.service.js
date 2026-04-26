const { z } = require('zod');
const prisma = require('../../config/prisma');
const { NotFoundError, AppError, ForbiddenError } = require('../../utils/errors');

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const taskInclude = {
  project: {
    select: { id: true, name: true, client: { select: { id: true, name: true } } },
  },
  assignee: { select: { id: true, name: true, email: true } },
};

const createSchema = z.object({
  projectId: z.string().min(1, 'Укажите проект'),
  title: z.string().min(1, 'Укажите название'),
  description: z.string().optional().nullable(),
  status: z.enum(STATUSES).default('TODO'),
  priority: z.enum(PRIORITIES).default('MEDIUM'),
  assigneeId: z.string().optional().nullable(),
  plannedStart: z.string().optional().nullable(),
  plannedEnd: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

const updateSchema = z.object({
  title: z.string().min(1, 'Укажите название').optional(),
  description: z.string().optional().nullable(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assigneeId: z.string().optional().nullable(),
  plannedStart: z.string().optional().nullable(),
  plannedEnd: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

const coerceDate = (v) => (v === '' || v == null ? null : new Date(v));

const getAll = async (filters = {}, ctx = {}) => {
  const where = {};
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.priority) where.priority = filters.priority;

  // MEMBER always sees only their own tasks
  if (ctx.role === 'MEMBER') {
    where.assigneeId = ctx.userId;
  } else if (filters.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  if (filters.overdue === 'true') {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    where.dueDate = { lt: now };
    where.status = { notIn: ['DONE', 'CANCELLED'] };
  } else {
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.dueDate = {};
      if (filters.dateFrom) where.dueDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.dueDate.lte = new Date(filters.dateTo);
    }
  }

  return prisma.task.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: taskInclude,
  });
};

const getById = async (id) => {
  const task = await prisma.task.findUnique({ where: { id }, include: taskInclude });
  if (!task) throw new NotFoundError('Задача не найдена');
  return task;
};

const create = async (data, createdById) => {
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { plannedStart, plannedEnd, dueDate, ...rest } = parsed.data;
  return prisma.task.create({
    data: {
      ...rest,
      createdById: createdById || null,
      plannedStart: coerceDate(plannedStart),
      plannedEnd: coerceDate(plannedEnd),
      dueDate: coerceDate(dueDate),
    },
    include: taskInclude,
  });
};

const update = async (id, data) => {
  await getById(id);
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  const { plannedStart, plannedEnd, dueDate, status, ...rest } = parsed.data;

  let completedAtUpdate = {};
  if (status !== undefined) {
    const current = await prisma.task.findUnique({ where: { id }, select: { status: true, completedAt: true } });
    if (status === 'DONE') {
      completedAtUpdate = { completedAt: new Date() };
    } else if (current.status === 'DONE') {
      completedAtUpdate = { completedAt: null };
    }
  }

  return prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(status !== undefined ? { status } : {}),
      ...completedAtUpdate,
      ...(plannedStart !== undefined ? { plannedStart: coerceDate(plannedStart) } : {}),
      ...(plannedEnd !== undefined ? { plannedEnd: coerceDate(plannedEnd) } : {}),
      ...(dueDate !== undefined ? { dueDate: coerceDate(dueDate) } : {}),
    },
    include: taskInclude,
  });
};

const updateStatus = async (id, status, ctx = {}) => {
  if (!STATUSES.includes(status)) throw new AppError('Неверный статус', 422);
  const task = await getById(id);

  if (ctx.role === 'MEMBER' && task.assigneeId !== ctx.userId) {
    throw new ForbiddenError('Недостаточно прав');
  }

  let completedAt = task.completedAt;
  if (status === 'DONE') {
    completedAt = new Date();
  } else if (task.status === 'DONE') {
    completedAt = null;
  }

  return prisma.task.update({
    where: { id },
    data: { status, completedAt },
    include: taskInclude,
  });
};

const remove = async (id) => {
  await getById(id);
  await prisma.task.delete({ where: { id } });
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
