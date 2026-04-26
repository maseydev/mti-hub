const cron = require('node-cron');
const billingSvc = require('../modules/billing/billing.service');

const start = () => {
  // Daily at 01:00
  cron.schedule('0 1 * * *', async () => {
    console.log('[billing.job] Running billing generation...');
    try {
      const genResult = await billingSvc.generateFromServices();
      console.log(`[billing.job] Generated: ${genResult.created}, skipped: ${genResult.skipped}`);

      const overdueCount = await billingSvc.updateOverdueStatuses();
      console.log(`[billing.job] Updated ${overdueCount} items to OVERDUE`);
    } catch (err) {
      console.error('[billing.job] Error:', err.message);
    }
  });

  console.log('[billing.job] Scheduled (daily 01:00)');
};

module.exports = { start };
