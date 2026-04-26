require('./config/env');
const app = require('./app');
const { PORT } = require('./config/env');
const billingJob = require('./jobs/billing.job');
const remindersJob = require('./jobs/reminders.job');

const start = async () => {
  billingJob.start();
  remindersJob.start();

  app.listen(PORT, () => {
    console.log(`[server] MTI-HUB backend running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
