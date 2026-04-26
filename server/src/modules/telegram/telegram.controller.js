const svc = require('./telegram.service');

// Admin: global finance reminder settings
const getSettings = async (req, res) => res.json({ data: await svc.getSettings() });
const updateSettings = async (req, res) => res.json({ data: await svc.updateSettings(req.body) });

// Admin: bot token management
const getBots = async (req, res) => res.json({ data: await svc.getBots() });
const updateBot = async (req, res) => res.json({ data: await svc.updateBot(req.params.type, req.body) });
const testBot = async (req, res) => {
  const result = await svc.testBot(req.params.type, req.body.chatId);
  res.json({ data: { ok: true, result } });
};

// Legacy global test
const test = async (req, res) => {
  const result = await svc.sendTest();
  res.json({ data: { ok: true, result } });
};

// User: personal telegram settings
const getMySettings = async (req, res) => res.json({ data: await svc.getMySettings(req.userId) });
const updateMySettings = async (req, res) => res.json({ data: await svc.updateMySettings(req.userId, req.body) });
const testMyTask = async (req, res) => {
  const result = await svc.testMyTask(req.userId);
  res.json({ data: { ok: true, result } });
};

module.exports = { getSettings, updateSettings, getBots, updateBot, testBot, test, getMySettings, updateMySettings, testMyTask };
