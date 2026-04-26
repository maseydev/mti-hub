const { Router } = require('express');
const ctrl = require('./tasks.controller');
const { verifyToken } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/status', ctrl.updateStatus);

module.exports = router;
