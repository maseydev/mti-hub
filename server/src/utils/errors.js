class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Не найдено') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Не авторизован') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Доступ запрещён') {
    super(message, 403);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Ошибка валидации') {
    super(message, 422);
  }
}

module.exports = { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError };
