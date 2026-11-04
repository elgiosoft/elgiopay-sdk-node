import { detectChannel, detectCountry } from '../src';

describe('detectChannel', () => {
  test.each([
    ['677 12 34 56', 'CMR', 'MTN_CMR'],
    ['+237 699 00 00 00', null, 'ORANGE_CMR'],
    ['652123456', 'CM', 'MTN_CMR'],
    ['656123456', 'CM', 'ORANGE_CMR'],
    ['024 123 4567', 'GHA', 'MTN_GHA'],
    ['0201234567', 'GH', 'VODAFONE_GHA'],
    ['00233 27 123 4567', null, 'AIRTELTIGO_GHA'],
    ['+254712345678', null, 'MPESA_KEN'],
    ['0110123456', 'KE', 'MPESA_KEN'],
    ['0731234567', 'KE', null],
    ['08031234567', 'NG', 'MTN_NGA'],
    ['+2348021234567', null, 'AIRTEL_NGA'],
    ['07 07 12 34 56', 'CI', 'ORANGE_CIV'],
    ['+225 05 05 12 34 56', null, 'MTN_CIV'],
    ['01 97 12 34 56', 'BJ', 'MTN_BEN'],
    ['95123456', 'BEN', 'MOOV_BEN'],
    ['+241 077 12 34 56', null, 'AIRTEL_GAB'],
    ['76 123 45 67', 'SN', 'FREE_SEN'],
    ['0772123456', 'UG', 'MTN_UGA'],
    ['+255621234567', null, 'HALOTEL_TZA'],
    ['0955123456', 'ZM', 'ZAMTEL_ZMB'],
    ['+243 81 234 5678', null, 'MPESA_COD'],
    ['033 123 4567', 'GH', null],
    ['612345678', 'FRA', null],
    ['0241234567', null, null],
    ['', 'CM', null],
  ])('%s (%s) → %s', (phone, country, expected) => {
    expect(detectChannel(phone, country)).toBe(expected);
  });

  test('reads the country from an international number', () => {
    expect(detectCountry('+233241234567')).toBe('GHA');
    expect(detectCountry('254712345678')).toBe('KEN');
    expect(detectCountry('0241234567')).toBeNull();
  });
});
