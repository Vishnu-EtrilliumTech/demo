/**
 * Formats a number as Indian Rupees with proper formatting
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: true)
 * @returns Formatted rupee string
 */
export const formatRupees = (amount: number, showDecimals: boolean = true): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  // Use Indian number formatting (lakhs and crores system)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return formatter.format(amount);
};

/**
 * Formats a number as Indian Rupees without decimals
 * @param amount - The amount to format
 * @returns Formatted rupee string without decimals
 */
export const formatRupeesWhole = (amount: number): string => {
  return formatRupees(amount, false);
};

/**
 * Parses a rupee string back to a number
 * @param rupeeString - String containing rupee amount (e.g., "₹1,23,456.78")
 * @returns Parsed number or 0 if invalid
 */
export const parseRupees = (rupeeString: string): number => {
  if (!rupeeString) return 0;
  
  // Remove currency symbol and commas, then parse
  const cleanString = rupeeString.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleanString);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats amount for display in table cells (compact format for large amounts)
 * @param amount - The amount to format
 * @returns Compact formatted rupee string
 */
export const formatRupeesCompact = (amount: number): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  // For amounts over 1 crore, show in crores
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  
  // For amounts over 1 lakh, show in lakhs
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  
  // For smaller amounts, use regular formatting
  return formatRupees(amount);
};