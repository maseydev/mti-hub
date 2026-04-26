const svc = require('./categories.service');

const getAll = async (req, res) => res.json({ data: await svc.getAll() });
const create = async (req, res) => res.status(201).json({ data: await svc.create(req.body) });
const update = async (req, res) => res.json({ data: await svc.update(req.params.id, req.body) });
const remove = async (req, res) => { await svc.remove(req.params.id); res.json({ data: { ok: true } }); };

module.exports = { getAll, create, update, remove };
