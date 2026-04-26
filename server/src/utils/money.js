const formatAmount = (amount, currency = 'RUB') =>
  `${Number(amount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

module.exports = { formatAmount };
