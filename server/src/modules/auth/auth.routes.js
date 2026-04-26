const { Router } = require('express');
const ctrl = require('./auth.controller');
const { verifyToken } = require('./auth.middleware');

const router = Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', verifyToken, ctrl.me);
router.patch('/me', verifyToken, ctrl.updateMe);
router.put('/password', verifyToken, ctrl.changePassword);

module.exports = router;
