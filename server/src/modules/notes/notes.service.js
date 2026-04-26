const { z } = require('zod');
const prisma = require('../../config/prisma');
const { AppError, ForbiddenError, NotFoundError } = require('../../utils/errors');

const MANAGER_ROLES = ['ADMIN', 'OWNER', 'MANAGER'];

const include = {
  client: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
};

const noteSchema = z.object({
  title: z.string().min(1, 'Укажите название'),
  content: z.string().default(''),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

const isManager = (role) => MANAGER_ROLES.includes(role);

const parseBool = (value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
};

const memberProjectAccessWhere = (userId) => ({
  OR: [
    { createdById: userId },
    {
      project: {
        tasks: {
          some: { assigneeId: userId },
        },
      },
    },
  ],
});

const ensureMemberCanAccess = async (note, ctx) => {
  if (isManager(ctx.role)) return;
  if (note.createdById === ctx.userId) return;
  if (!note.projectId) throw new ForbiddenError('Недостаточно прав');

  const task = await prisma.task.findFirst({
    where: { projectId: note.projectId, assigneeId: ctx.userId },
    select: { id: true },
  });
  if (!task) throw new ForbiddenError('Недостаточно прав');
};

const ensureCanManage = (note, ctx) => {
  if (isManager(ctx.role)) return;
  if (note.createdById !== ctx.userId) throw new ForbiddenError('Недостаточно прав');
};

const buildWhere = (filters = {}, ctx) => {
  const where = {};
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { content: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.createdById) where.createdById = filters.createdById;

  const isPinned = parseBool(filters.isPinned);
  if (isPinned !== undefined) where.isPinned = isPinned;
  const isArchived = parseBool(filters.isArchived);
  if (isArchived !== undefined) where.isArchived = isArchived;

  if (!isManager(ctx.role)) {
    where.AND = [...(where.AND || []), memberProjectAccessWhere(ctx.userId)];
  }

  return where;
};

const getAll = async (filters = {}, ctx) =>
  prisma.note.findMany({
    where: buildWhere(filters, ctx),
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    include,
  });

const getById = async (id, ctx) => {
  const note = await prisma.note.findUnique({ where: { id }, include });
  if (!note) throw new NotFoundError('Заметка не найдена');
  await ensureMemberCanAccess(note, ctx);
  return note;
};

const create = async (data, ctx) => {
  const parsed = noteSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  return prisma.note.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content || '',
      clientId: parsed.data.clientId || null,
      projectId: parsed.data.projectId || null,
      isPinned: parsed.data.isPinned || false,
      isArchived: parsed.data.isArchived || false,
      createdById: ctx.userId,
    },
    include,
  });
};

const update = async (id, data, ctx) => {
  const note = await getById(id, ctx);
  ensureCanManage(note, ctx);

  const parsed = noteSchema.partial().safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  return prisma.note.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.clientId !== undefined ? { clientId: parsed.data.clientId || null } : {}),
      ...(parsed.data.projectId !== undefined ? { projectId: parsed.data.projectId || null } : {}),
    },
    include,
  });
};

const remove = async (id, ctx) => {
  const note = await getById(id, ctx);
  ensureCanManage(note, ctx);
  await prisma.note.delete({ where: { id } });
};

const setFlag = async (id, field, value, ctx) => {
  const note = await getById(id, ctx);
  ensureCanManage(note, ctx);
  return prisma.note.update({ where: { id }, data: { [field]: value }, include });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  pin: (id, ctx) => setFlag(id, 'isPinned', true, ctx),
  unpin: (id, ctx) => setFlag(id, 'isPinned', false, ctx),
  archive: (id, ctx) => setFlag(id, 'isArchived', true, ctx),
  unarchive: (id, ctx) => setFlag(id, 'isArchived', false, ctx),
};
