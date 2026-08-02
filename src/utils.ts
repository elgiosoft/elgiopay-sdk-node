/**
 * Utility functions for ElgioPay SDK
 */

/**
 * Normalize Cameroon phone number to +237 format
 */
export function normalizeCameroonPhone(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle different formats
  const match237 = cleaned.match(/^(\+237|237)([67]\d{8})$/);
  if (match237) {
    return '+237' + match237[2];
  }
  
  const matchLocal = cleaned.match(/^([67]\d{8})$/);
  if (matchLocal) {
    return '+237' + matchLocal[1];
  }
  
  // Return as is if format doesn't match (will fail validation)
  return phone;
}

/**
 * Validate Cameroon phone number format
 */
export function isValidCameroonPhone(phone: string): boolean {
  const normalized = normalizeCameroonPhone(phone);
  return /^\+237[67]\d{8}$/.test(normalized);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a random reference ID
 */
export function generateReference(prefix: string = 'SOFI'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

/**
 * Validate amount for XAF currency (minimum 100 XAF)
 */
export function validateAmount(amount: number, currency: string = 'XAF'): boolean {
  if (currency === 'XAF') {
    return amount >= 100;
  }
  return amount > 0;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, currency: string = 'XAF'): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Sleep utility for retry mechanisms
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff calculation
 */
export function calculateBackoff(attempt: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}