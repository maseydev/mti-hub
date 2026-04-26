const { Router } = require('express');
const ctrl = require('./transactions.controller');
const { verifyToken, requireAdmin } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken, requireAdmin);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
