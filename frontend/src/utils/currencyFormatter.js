/**
 * Format an amount into a localized currency string based on user preference.
 * Defaults to USD if no currency is provided.
 * 
 * @param {number} amount - The numeric amount to format
 * @param {string} currencyCode - The ISO 4217 currency code (e.g., 'USD', 'INR', 'CAD')
 * @returns {string} The localized currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0;
  }

  // Define locale based on currency for accurate symbol placement and thousands separators
  let locale = 'en-US';
  if (currencyCode === 'INR') {
    locale = 'en-IN';
  } else if (currencyCode === 'CAD') {
    locale = 'en-CA';
  } else if (currencyCode === 'EUR') {
    locale = 'en-IE'; // European formatting
  } else if (currencyCode === 'GBP') {
    locale = 'en-GB';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if an invalid currency code is passed somehow
    console.error(`Invalid currency code: ${currencyCode}`, error);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
};
