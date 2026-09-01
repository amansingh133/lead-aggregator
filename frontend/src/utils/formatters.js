import dayjs from 'dayjs';

export function formatDate(value, fallback = '—') {
  if (!value) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format('DD MMM YYYY') : fallback;
}

export function formatDateTime(value, fallback = '—') {
  if (!value) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format('DD MMM YYYY, hh:mm A') : fallback;
}

export function formatTime(value, fallback = '—') {
  if (!value) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format('hh:mm A') : fallback;
}

export function formatCurrency(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    value
  );
}

export function formatNumber(value, fallback = '0') {
  if (value === null || value === undefined) return fallback;
  return new Intl.NumberFormat('en-IN').format(value);
}
