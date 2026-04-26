const { Router } = require('express');
const ctrl = require('./billing.controller');
const { verifyToken } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken);

router.get('/items', ctrl.getItems);
router.post('/items', ctrl.createItem);
router.get('/items/:id', ctrl.getItemById);
router.put('/items/:id', ctrl.updateItem);
router.post('/items/:id/mark-paid', ctrl.markPaid);
router.post('/generate', ctrl.generate);

module.exports = router;
