const svc = require('./billing.service');

const getItems = async (req, res) => res.json({ data: await svc.getItems(req.query) });
const getItemById = async (req, res) => res.json({ data: await svc.getItemById(req.params.id) });
const createItem = async (req, res) => res.status(201).json({ data: await svc.createItem(req.body) });
const updateItem = async (req, res) => res.json({ data: await svc.updateItem(req.params.id, req.body) });
const markPaid = async (req, res) => res.json({ data: await svc.markPaid(req.params.id, req.body) });
const generate = async (req, res) => res.json({ data: await svc.generateFromServices() });

module.exports = { getItems, getItemById, createItem, updateItem, markPaid, generate };
