const svc = require('./dashboard.service');

const summary = async (req, res) => res.json({ data: await svc.getSummary() });
const upcomingPayments = async (req, res) => res.json({ data: await svc.getUpcomingPayments() });
const overdue = async (req, res) => res.json({ data: await svc.getOverdue() });
const monthlyChart = async (req, res) => res.json({ data: await svc.getMonthlyChart() });

module.exports = { summary, upcomingPayments, overdue, monthlyChart };
