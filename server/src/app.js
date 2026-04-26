const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./modules/auth/auth.routes');
const clientsRoutes = require('./modules/clients/clients.routes');
const projectsRoutes = require('./modules/projects/projects.routes');
const servicesRoutes = require('./modules/services/services.routes');
const billingRoutes = require('./modules/billing/billing.routes');
const transactionsRoutes = require('./modules/transactions/transactions.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const accountsRoutes = require('./modules/accounts/accounts.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const telegramRoutes = require('./modules/telegram/telegram.routes');
const teamRoutes = require('./modules/team/team.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/tasks', tasksRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Внутренняя ошибка сервера';

  if (!err.isOperational) {
    console.error('[error]', err);
  }

  res.status(status).json({ error: message });
});

module.exports = app;
