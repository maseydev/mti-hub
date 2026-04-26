const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../../config/prisma');
const { JWT_SECRET, JWT_ACCESS_TTL } = require('../../config/env');
const { AppError, NotFoundError, UnauthorizedError } = require('../../utils/errors');

const USER_SELECT = { id: true, email: true, name: true, role: true, position: true, telegram: true, isActive: true, locale: true, currency: true, createdAt: true };

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().min(1, 'Укажите имя'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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

module.exports = { register, login, getMe };
