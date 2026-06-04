/**
 * Format dynamic values to currency strings
 */
export const formatCurrency = (amount, currencyCode = 'USD', compact = false, forceFull = false) => {
  const code = currencyCode || 'USD';
  try {
    const options = {
      style: 'currency',
      currency: code,
    };
    // Automatically use compact notation for amounts >= 1 Million to prevent layout overflows
    if (!forceFull && (compact || Math.abs(amount) >= 1000000)) {
      options.notation = 'compact';
      options.compactDisplay = 'short';
    }
    return new Intl.NumberFormat(undefined, options).format(amount);
  } catch (e) {
    // Fallback if code is invalid
    return `${code} ${amount.toFixed(2)}`;
  }
};

/**
 * Format date objects to clean strings
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
