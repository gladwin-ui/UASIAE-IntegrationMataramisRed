/**
 * Format number to Indonesian Rupiah currency
 * @param amount - Number to format
 * @returns Formatted string (e.g., "Rp 50.000")
 */
export const formatRupiah = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return 'Rp 0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

/**
 * Format number to Indonesian Rupiah without "Rp" prefix
 * @param amount - Number to format
 * @returns Formatted string (e.g., "50.000")
 */
export const formatRupiahWithoutSymbol = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }

  return new Intl.NumberFormat('id-ID').format(numAmount);
};

/**
 * Parse Rupiah string to number
 * @param rupiahString - String like "Rp 50.000" or "50000"
 * @returns Number
 */
export const parseRupiah = (rupiahString: string): number => {
  if (!rupiahString) return 0;
  
  // Remove "Rp", spaces, and dots (thousand separators)
  const cleaned = rupiahString.replace(/Rp\s?|\./g, '').trim();
  return parseFloat(cleaned) || 0;
};

