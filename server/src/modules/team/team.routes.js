const { Router } = require('express');
const ctrl = require('./team.controller');
const { verifyToken, requireRoles, requireManagerOrAbove } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken);

const canManage = requireRoles('OWNER', 'ADMIN');

router.get('/', requireManagerOrAbove, ctrl.getAll);
router.get('/:id', requireManagerOrAbove, ctrl.getById);
router.post('/', canManage, ctrl.create);
router.put('/:id', canManage, ctrl.update);
router.delete('/:id', canManage, ctrl.deactivate);

module.exports = router;
