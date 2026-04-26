const svc = require('./tasks.service');

const getAll = async (req, res) => {
  const data = await svc.getAll(req.query);
  res.json({ data });
};

const getById = async (req, res) => {
  const data = await svc.getById(req.params.id);
  res.json({ data });
};

const create = async (req, res) => {
  const data = await svc.create(req.body, req.userId);
  res.status(201).json({ data });
};

const update = async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  res.json({ data });
};

const updateStatus = async (req, res) => {
  const data = await svc.updateStatus(req.params.id, req.body.status);
  res.json({ data });
};

const remove = async (req, res) => {
  await svc.remove(req.params.id);
  res.json({ data: { ok: true } });
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
