/**
 * Generate random order code that is consistent for the same order ID
 * Uses order ID as seed to ensure same order always gets same code
 * Format: FD-XXXX-XXXXXX-XXX
 */
export const generateOrderCode = (orderId: number): string => {
  // Use order ID as seed for consistent random generation
  const seed = orderId * 12345; // Simple seed multiplier
  
  // Simple seeded random function
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate 4 characters for first part
  for (let i = 0; i < 4; i++) {
    const random = seededRandom(seed + i);
    code += chars.charAt(Math.floor(random * chars.length));
  }
  
  code += '-';
  
  // Generate 6 characters for second part
  for (let i = 0; i < 6; i++) {
    const random = seededRandom(seed + i + 10);
    code += chars.charAt(Math.floor(random * chars.length));
  }
  
  code += '-';
  
  // Generate 3 characters for third part
  for (let i = 0; i < 3; i++) {
    const random = seededRandom(seed + i + 20);
    code += chars.charAt(Math.floor(random * chars.length));
  }
  
  return `FD-${code}`;
};
