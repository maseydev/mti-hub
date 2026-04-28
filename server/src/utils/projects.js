const { AppError, NotFoundError } = require('./errors');

const ensureProjectCanBeLinked = async (prisma, projectId, clientId = null) => {
  if (!projectId) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, clientId: true, status: true },
  });

  if (!project) throw new NotFoundError('Проект не найден');
  if (project.status === 'ARCHIVED') {
    throw new AppError('Нельзя привязать архивный проект', 422);
  }
  if (clientId && project.clientId !== clientId) {
    throw new AppError('Проект не принадлежит выбранному клиенту', 422);
  }

  return project;
};

module.exports = { ensureProjectCanBeLinked };
