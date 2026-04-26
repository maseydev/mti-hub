const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { JWT_SECRET, JWT_ACCESS_TTL } = require('../../config/env');
const { AppError, NotFoundError, UnauthorizedError } = require('../../utils/errors');

const USER_SELECT = { id: true, email: true, name: true, role: true, position: true, telegram: true, isActive: true, telegramChatId: true, taskNotificationsEnabled: true, financeNotificationsEnabled: true, locale: true, currency: true, createdAt: true };

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().min(1, 'Укажите имя'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  email: z.string().email('Некорректный email').optional(),
  name: z.string().min(1, 'Укажите имя').optional(),
  position: z.string().optional().nullable(),
  telegram: z.string().optional().nullable(),
  locale: z.string().min(2).max(12).optional(),
  currency: z.string().min(3).max(8).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Укажите текущий пароль'),
  newPassword: z.string().min(6, 'Новый пароль минимум 6 символов'),
});

const register = async (data) => {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Пользователь с таким email уже существует');

  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.create({ data: { email, passwordHash, name }, select: USER_SELECT });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_ACCESS_TTL });
  return { user, token };
};

const login = async (data) => {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) throw new UnauthorizedError('Неверный email или пароль');

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError('Неверный email или пароль');

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw new UnauthorizedError('Неверный email или пароль');

  if (!user.isActive) throw new UnauthorizedError('Аккаунт деактивирован');

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_ACCESS_TTL });
  const { passwordHash: _, ...userSafe } = user;
  return { user: userSafe, token };
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw new NotFoundError('Пользователь не найден');
  return user;
};

const updateMe = async (userId, data) => {
  const parsed = updateMeSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  if (parsed.data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) throw new AppError('Пользователь с таким email уже существует');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: USER_SELECT,
  });
  return user;
};

const changePassword = async (userId, data) => {
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 422);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) throw new NotFoundError('Пользователь не найден');

  const valid = await argon2.verify(user.passwordHash, parsed.data.currentPassword);
  if (!valid) throw new UnauthorizedError('Текущий пароль указан неверно');

  const passwordHash = await argon2.hash(parsed.data.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
};

module.exports = { register, login, getMe, updateMe, changePassword };
