const svc = require('./tasks.service');

const ctx = (req) => ({ userId: req.userId, role: req.userRole });

const getAll = async (req, res) => {
  const data = await svc.getAll(req.query, ctx(req));
  res.json({ data });
};

const getById = async (req, res) => {
  const data = await svc.getById(req.params.id, ctx(req));
  res.json({ data });
};

const create = async (req, res) => {
  const data = await svc.create(req.body, ctx(req));
  res.status(201).json({ data });
};

const update = async (req, res) => {
  const data = await svc.update(req.params.id, req.body, ctx(req));
  res.json({ data });
};

const updateStatus = async (req, res) => {
  const data = await svc.updateStatus(req.params.id, req.body.status, ctx(req));
  res.json({ data });
};

const remove = async (req, res) => {
  await svc.remove(req.params.id, ctx(req));
  res.json({ data: { ok: true } });
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
