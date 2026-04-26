const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfMonth = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const today = () => startOfDay(new Date());

const addCycleToDate = (date, billingCycle) => {
  switch (billingCycle) {
    case 'MONTHLY':    return addMonths(date, 1);
    case 'QUARTERLY':  return addMonths(date, 3);
    case 'SEMI_YEARLY':return addMonths(date, 6);
    case 'YEARLY':     return addYears(date, 1);
    default:           return addMonths(date, 1);
  }
};

const formatDateRu = (date) =>
  new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const monthNameRu = (date) =>
  new Date(date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

module.exports = { addMonths, addYears, startOfDay, startOfMonth, endOfMonth, today, addCycleToDate, formatDateRu, monthNameRu };
