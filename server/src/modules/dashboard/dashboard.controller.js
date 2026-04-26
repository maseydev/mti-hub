const svc = require('./dashboard.service');

const summary = async (req, res) => res.json({ data: await svc.getSummary() });
const upcomingPayments = async (req, res) => res.json({ data: await svc.getUpcomingPayments() });
const overdue = async (req, res) => res.json({ data: await svc.getOverdue() });
const monthlyChart = async (req, res) => res.json({ data: await svc.getMonthlyChart() });

const teamTasks = async (req, res) => {
  const [taskSummary, list] = await Promise.all([svc.getTaskSummary(), svc.getTaskList()]);
  res.json({ data: { summary: taskSummary, list } });
};

const myTasks = async (req, res) => {
  const [taskSummary, list] = await Promise.all([svc.getTaskSummary(req.userId), svc.getTaskList(req.userId)]);
  res.json({ data: { summary: taskSummary, list } });
};

const adminTasks = async (req, res) => {
  const data = await svc.getAdminTaskDashboard(req.userId);
  res.json({ data });
};

module.exports = { summary, upcomingPayments, overdue, monthlyChart, teamTasks, myTasks, adminTasks };
