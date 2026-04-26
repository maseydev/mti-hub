const { Router } = require('express');
const ctrl = require('./telegram.controller');
const { verifyToken } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken);

router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSettings);
router.post('/test', ctrl.test);

module.exports = router;
