const { Router } = require('express');
const ctrl = require('./notes.controller');
const { verifyToken, loadUser } = require('../auth/auth.middleware');

const router = Router();
router.use(verifyToken, loadUser);

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/pin', ctrl.pin);
router.post('/:id/unpin', ctrl.unpin);
router.post('/:id/archive', ctrl.archive);
router.post('/:id/unarchive', ctrl.unarchive);

module.exports = router;
