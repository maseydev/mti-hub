const { Router } = require('express');
const ctrl = require('./telegram.controller');
const { verifyToken, requireAdmin } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken);

// Admin: global finance reminder settings + bot management
router.get('/settings', requireAdmin, ctrl.getSettings);
router.put('/settings', requireAdmin, ctrl.updateSettings);
router.post('/test', requireAdmin, ctrl.test);
router.get('/bots', requireAdmin, ctrl.getBots);
router.put('/bots/:type', requireAdmin, ctrl.updateBot);
router.post('/bots/:type/test', requireAdmin, ctrl.testBot);

// All authenticated users: personal telegram settings
router.get('/me', ctrl.getMySettings);
router.put('/me', ctrl.updateMySettings);
router.post('/me/test-task', ctrl.testMyTask);

module.exports = router;
