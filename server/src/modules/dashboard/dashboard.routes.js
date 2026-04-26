const { Router } = require('express');
const ctrl = require('./dashboard.controller');
const { verifyToken, loadUser, requireAdmin, requireManagerOrAbove } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken, loadUser);

router.get('/summary', requireAdmin, ctrl.summary);
router.get('/upcoming-payments', requireAdmin, ctrl.upcomingPayments);
router.get('/overdue', requireAdmin, ctrl.overdue);
router.get('/monthly-chart', requireAdmin, ctrl.monthlyChart);

router.get('/admin-tasks', requireAdmin, ctrl.adminTasks);
router.get('/team-tasks', requireManagerOrAbove, ctrl.teamTasks);
router.get('/my-tasks', ctrl.myTasks);

module.exports = router;
