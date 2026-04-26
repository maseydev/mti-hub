const { Router } = require('express');
const ctrl = require('./projects.controller');
const { verifyToken, loadUser, requireManagerOrAbove } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken, loadUser);

router.get('/', requireManagerOrAbove, ctrl.getAll);
router.post('/', requireManagerOrAbove, ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', requireManagerOrAbove, ctrl.update);
router.delete('/:id', requireManagerOrAbove, ctrl.remove);

module.exports = router;
