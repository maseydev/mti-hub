const { Router } = require('express');
const ctrl = require('./tasks.controller');
const { verifyToken, loadUser, requireManagerOrAbove } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken, loadUser);

router.get('/', ctrl.getAll);
router.post('/', requireManagerOrAbove, ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', requireManagerOrAbove, ctrl.update);
router.delete('/:id', requireManagerOrAbove, ctrl.remove);
router.post('/:id/status', ctrl.updateStatus);

module.exports = router;
