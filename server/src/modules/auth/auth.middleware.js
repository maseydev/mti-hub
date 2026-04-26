const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { UnauthorizedError, ForbiddenError } = require('../../utils/errors');
const prisma = require('../../config/prisma');

// OWNER kept for backward compat with existing data
const ADMIN_ROLES = ['ADMIN', 'OWNER'];
const MANAGER_ROLES = ['ADMIN', 'OWNER', 'MANAGER'];

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next(new UnauthorizedError('Токен не предоставлен'));
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    next(new UnauthorizedError('Недействительный токен'));
  }
};

const loadUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, isActive: true },
    });
    if (!user || !user.isActive) return next(new UnauthorizedError('Аккаунт деактивирован'));
    req.userRole = user.role;
    next();
  } catch (err) {
    next(err);
  }
};

const requireRoles = (...roles) => async (req, res, next) => {
  try {
    if (!req.userRole) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true, isActive: true },
      });
      if (!user || !user.isActive) return next(new UnauthorizedError('Аккаунт деактивирован'));
      req.userRole = user.role;
    }
    if (!roles.includes(req.userRole)) return next(new ForbiddenError('Недостаточно прав'));
    next();
  } catch (err) {
    next(err);
  }
};

const requireAdmin = requireRoles(...ADMIN_ROLES);
const requireManagerOrAbove = requireRoles(...MANAGER_ROLES);

module.exports = {
  verifyToken,
  loadUser,
  requireRoles,
  requireAdmin,
  requireManagerOrAbove,
  ADMIN_ROLES,
  MANAGER_ROLES,
};
