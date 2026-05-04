import { describe, it, expect } from 'vitest';
import { validateDocument, formatDocument, detectPersonType } from '../lib/validations';

describe('validateDocument', () => {
  it('should reject empty document', () => {
    expect(validateDocument('')).toBe(false);
  });

  it('should reject document with wrong length', () => {
    expect(validateDocument('123')).toBe(false);
  });

  it('should reject 12-digit input', () => {
    expect(validateDocument('123456789012')).toBe(false);
  });

  it('should reject all-same-digit CPF', () => {
    expect(validateDocument('11111111111')).toBe(false);
  });
});

describe('formatDocument', () => {
  it('should format CPF', () => {
    expect(formatDocument('12345678901')).toBe('123.456.789-01');
  });

  it('should format CNPJ', () => {
    expect(formatDocument('12345678901234')).toBe('12.345.678/9012-34');
  });

  it('should return original if not CPF or CNPJ', () => {
    expect(formatDocument('ABC')).toBe('ABC');
  });
});

describe('detectPersonType', () => {
  it('should detect PF for 11 digits', () => {
    expect(detectPersonType('12345678901')).toBe('PF');
  });

  it('should detect PJ for 14 digits', () => {
    expect(detectPersonType('12345678901234')).toBe('PJ');
  });
});