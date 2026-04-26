const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { UnauthorizedError } = require('../../utils/errors');

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

module.exports = { verifyToken };
