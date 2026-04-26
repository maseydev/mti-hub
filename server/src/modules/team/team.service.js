const { z } = require('zod');
const argon2 = require('argon2');
const prisma = require('../../config/prisma');
const { AppError, NotFoundError } = require('../../utils/errors');

const PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  position: true,
  telegram: true,
  isActive: true,
  locale: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
};

const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'];

const createSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().min(1, 'Укажите имя'),
  role: z.enum(ROLES).default('MEMBER'),
  position: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateSchema = z.object({
  name: z.string().min(1, 'Укажите имя').optional(),
  email: z.string().email('Некорректный email').optional(),
  role: z.enum(ROLES).optional(),
  position: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const getAll = async () =>
  prisma.user.findMany({ select: PUBLIC_SELECT, orderBy: { createdAt: 'asc' } });

const getById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_SELECT });
  if (!user) throw new NotFoundError('Участник не найден');
  return user;
};

const create = async (data) => {
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  const { password, ...rest } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: rest.email } });
  if (existing) throw new AppError('Пользователь с таким email уже существует');

  const passwordHash = await argon2.hash(password);
  return prisma.user.create({ data: { ...rest, passwordHash }, select: PUBLIC_SELECT });
};

const update = async (id, data) => {
  await getById(id);
  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  if (parsed.data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id } },
    });
    if (existing) throw new AppError('Email уже используется');
  }

  return prisma.user.update({ where: { id }, data: parsed.data, select: PUBLIC_SELECT });
};

const deactivate = async (id) => {
  await getById(id);
  return prisma.user.update({ where: { id }, data: { isActive: false }, select: PUBLIC_SELECT });
};

module.exports = { getAll, getById, create, update, deactivate };
