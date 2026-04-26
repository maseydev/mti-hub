const authService = require('./auth.service');

const register = async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ data: result });
};

const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ data: result });
};

const me = async (req, res) => {
  const user = await authService.getMe(req.userId);
  res.json({ data: user });
};

const updateMe = async (req, res) => {
  const user = await authService.updateMe(req.userId, req.body);
  res.json({ data: user });
};

const changePassword = async (req, res) => {
  await authService.changePassword(req.userId, req.body);
  res.json({ data: { ok: true } });
};

module.exports = { register, login, me, updateMe, changePassword };
