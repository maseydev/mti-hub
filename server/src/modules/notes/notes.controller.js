const svc = require('./notes.service');

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

const remove = async (req, res) => {
  await svc.remove(req.params.id, ctx(req));
  res.json({ data: { ok: true } });
};

const pin = async (req, res) => res.json({ data: await svc.pin(req.params.id, ctx(req)) });
const unpin = async (req, res) => res.json({ data: await svc.unpin(req.params.id, ctx(req)) });
const archive = async (req, res) => res.json({ data: await svc.archive(req.params.id, ctx(req)) });
const unarchive = async (req, res) => res.json({ data: await svc.unarchive(req.params.id, ctx(req)) });

module.exports = { getAll, getById, create, update, remove, pin, unpin, archive, unarchive };
