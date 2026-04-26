const { Router } = require('express');
const ctrl = require('./clients.controller');
const { verifyToken, requireManagerOrAbove } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken, requireManagerOrAbove);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
