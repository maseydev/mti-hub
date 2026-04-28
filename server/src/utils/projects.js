const { AppError, NotFoundError } = require('./errors');

const ensureClientCanBeLinked = async (prisma, clientId) => {
  if (!clientId) return null;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, status: true },
  });

  if (!client) throw new NotFoundError('Клиент не найден');
  if (client.status === 'ARCHIVED') {
    throw new AppError('Нельзя привязать архивного клиента', 422);
  }

  return client;
};

const ensureProjectCanBeLinked = async (prisma, projectId, clientId = null) => {
  if (!projectId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      clientId: true,
      status: true,
      client: { select: { status: true } },
    },
  });

  if (!project) throw new NotFoundError('Проект не найден');
  if (project.status === 'ARCHIVED') {
    throw new AppError('Нельзя привязать архивный проект', 422);
  }
  if (project.client.status === 'ARCHIVED') {
    throw new AppError('Нельзя привязать проект архивного клиента', 422);
  }
  if (clientId && project.clientId !== clientId) {
    throw new AppError('Проект не принадлежит выбранному клиенту', 422);
  }

  return project;
};

module.exports = { ensureClientCanBeLinked, ensureProjectCanBeLinked };
