const svc = require('./services.service');

const getAll = async (req, res) => res.json({ data: await svc.getAll(req.query) });
const getById = async (req, res) => res.json({ data: await svc.getById(req.params.id) });
const create = async (req, res) => res.status(201).json({ data: await svc.create(req.body) });
const update = async (req, res) => res.json({ data: await svc.update(req.params.id, req.body) });
const remove = async (req, res) => { await svc.remove(req.params.id); res.json({ data: { ok: true } }); };
const pause = async (req, res) => res.json({ data: await svc.pause(req.params.id) });
const resume = async (req, res) => res.json({ data: await svc.resume(req.params.id) });

module.exports = { getAll, getById, create, update, remove, pause, resume };
