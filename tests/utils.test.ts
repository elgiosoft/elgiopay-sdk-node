import {
  normalizeCameroonPhone,
  isValidCameroonPhone,
  isValidEmail,
  validateAmount,
  formatAmount,
  generateReference
} from '../src/utils';

describe('Utils', () => {
  describe('Phone number utilities', () => {
    test('normalizeCameroonPhone should format phone numbers correctly', () => {
      expect(normalizeCameroonPhone('677123456')).toBe('+237677123456');
      expect(normalizeCameroonPhone('237677123456')).toBe('+237677123456');
      expect(normalizeCameroonPhone('+237677123456')).toBe('+237677123456');
      expect(normalizeCameroonPhone('677 123 456')).toBe('+237677123456');
    });

    test('isValidCameroonPhone should validate phone numbers', () => {
      expect(isValidCameroonPhone('+237677123456')).toBe(true);
      expect(isValidCameroonPhone('+237677123456')).toBe(true);
      expect(isValidCameroonPhone('677123456')).toBe(true);
      expect(isValidCameroonPhone('123456789')).toBe(false);
      expect(isValidCameroonPhone('+225123456789')).toBe(false);
    });
  });

  describe('Email validation', () => {
    test('isValidEmail should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
    });
  });

  describe('Amount validation', () => {
    test('validateAmount should validate XAF amounts', () => {
      expect(validateAmount(100, 'XAF')).toBe(true);
      expect(validateAmount(1000, 'XAF')).toBe(true);
      expect(validateAmount(99, 'XAF')).toBe(false);
      expect(validateAmount(0, 'XAF')).toBe(false);
    });

    test('validateAmount should validate other currencies', () => {
      expect(validateAmount(1, 'EUR')).toBe(true);
      expect(validateAmount(0.01, 'EUR')).toBe(true);
      expect(validateAmount(0, 'EUR')).toBe(false);
      expect(validateAmount(-1, 'EUR')).toBe(false);
    });
  });

  describe('Amount formatting', () => {
    test('formatAmount should format XAF amounts', () => {
      const formatted = formatAmount(5000, 'XAF');
      expect(formatted).toContain('5');
      expect(formatted).toContain('000');
    });
  });

  describe('Reference generation', () => {
    test('generateReference should create valid references', () => {
      const ref1 = generateReference();
      const ref2 = generateReference('TEST');
      
      expect(ref1).toMatch(/^SOFI_/);
      expect(ref2).toMatch(/^TEST_/);
      expect(ref1).not.toBe(ref2);
      expect(ref1.length).toBeGreaterThan(10);
    });
  });
});