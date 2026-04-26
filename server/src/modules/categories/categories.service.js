const { z } = require('zod');
const prisma = require('../../config/prisma');
const { NotFoundError, AppError, ForbiddenError } = require('../../utils/errors');

const categorySchema = z.object({
  name: z.string().min(1, 'Укажите название'),
  type: z.enum(['INCOME', 'EXPENSE']),
  color: z.string().optional().nullable(),
});

const getAll = async () =>
  prisma.category.findMany({ orderBy: [{ type: 'asc' }, { name: 'asc' }] });

const create = async (data) => {
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  return prisma.category.create({ data: parsed.data });
};

const update = async (id, data) => {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new NotFoundError('Категория не найдена');

  const parsed = categorySchema.partial().safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);
  return prisma.category.update({ where: { id }, data: parsed.data });
};

const remove = async (id) => {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new NotFoundError('Категория не найдена');
  if (cat.isSystem) throw new ForbiddenError('Нельзя удалить системную категорию');

  const usage = await prisma.transaction.count({ where: { categoryId: id } });
  if (usage > 0) throw new AppError(`Категория используется в ${usage} транзакциях`);

  return prisma.category.delete({ where: { id } });
};

module.exports = { getAll, create, update, remove };
