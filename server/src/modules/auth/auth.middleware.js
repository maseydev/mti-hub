const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { UnauthorizedError, ForbiddenError } = require('../../utils/errors');
const prisma = require('../../config/prisma');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Токен не предоставлен'));
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    next(new UnauthorizedError('Недействительный токен'));
  }
};

const requireRoles = (...roles) => async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, isActive: true },
    });
    if (!user || !user.isActive) return next(new UnauthorizedError('Аккаунт деактивирован'));
    if (!roles.includes(user.role)) return next(new ForbiddenError('Недостаточно прав'));
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyToken, requireRoles };
