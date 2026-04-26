const { Router } = require('express');
const ctrl = require('./dashboard.controller');
const { verifyToken } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken);

router.get('/summary', ctrl.summary);
router.get('/upcoming-payments', ctrl.upcomingPayments);
router.get('/overdue', ctrl.overdue);
router.get('/monthly-chart', ctrl.monthlyChart);

module.exports = router;
