const svc = require('./telegram.service');

const getSettings = async (req, res) => res.json({ data: await svc.getSettings() });
const updateSettings = async (req, res) => res.json({ data: await svc.updateSettings(req.body) });
const test = async (req, res) => {
  const result = await svc.sendTest();
  res.json({ data: { ok: true, result } });
};

module.exports = { getSettings, updateSettings, test };
