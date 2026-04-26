const svc = require('./team.service');

const getAll = async (req, res) => {
  const data = await svc.getAll();
  res.json({ data });
};

const getById = async (req, res) => {
  const data = await svc.getById(req.params.id);
  res.json({ data });
};

const create = async (req, res) => {
  const data = await svc.create(req.body);
  res.status(201).json({ data });
};

const update = async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  res.json({ data });
};

const deactivate = async (req, res) => {
  const data = await svc.deactivate(req.params.id);
  res.json({ data });
};

module.exports = { getAll, getById, create, update, deactivate };
