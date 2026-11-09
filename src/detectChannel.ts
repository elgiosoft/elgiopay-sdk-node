/**
 * Best-effort guess of the mobile-money channel (e.g. `MTN_GHA`) from a phone number, by operator prefix.
 *
 * Numbers can move between operators (number portability in Ghana, Kenya, Nigeria…), and wallets such as
 * Wave work on any number, so treat the result as a pre-selection the customer can change, never as proof.
 * Returns null when the country or the operator cannot be told; it never falls back to a default operator.
 *
 * Prefixes apply to the national number as dialled inside the country, without the trunk `0`, except where
 * the leading `0` is part of the number itself (Benin, Burkina Faso, Côte d'Ivoire, Congo, Gabon).
 * Not covered yet: Chad, Central African Republic, Equatorial Guinea, Sierra Leone.
 * Kept in sync with ChannelDetector in the PHP SDK.
 */

interface CountryPrefixes {
  dial: string;
  keepsZero: boolean;
  channels: Record<string, string[]>;
}

const BENIN_MTN = ['42', '46', '50', '51', '52', '53', '54', '56', '57', '59', '61', '62', '66', '67', '69', '90', '91', '96', '97'];
const BENIN_MOOV = ['45', '55', '58', '60', '63', '64', '65', '68', '94', '95', '98', '99'];

const COUNTRIES: Record<string, CountryPrefixes> = {
  CMR: {
    dial: '237',
    keepsZero: false,
    channels: {
      MTN_CMR: ['67', '650', '651', '652', '653', '654', '680', '681', '682', '683', '684'],
      ORANGE_CMR: ['69', '64', '655', '656', '657', '658', '659', '685', '686', '687', '688', '689'],
    },
  },
  GAB: { dial: '241', keepsZero: true, channels: { AIRTEL_GAB: ['074', '076', '077'], MOOV_GAB: ['062', '065', '066'] } },
  COG: { dial: '242', keepsZero: true, channels: { MTN_COG: ['06'], AIRTEL_COG: ['05', '04'] } },
  // Ten-digit numbers since 2024 (`01` + the former eight digits); the old form is still typed.
  BEN: {
    dial: '229',
    keepsZero: true,
    channels: {
      MTN_BEN: [...BENIN_MTN.map((prefix) => `01${prefix}`), ...BENIN_MTN],
      MOOV_BEN: [...BENIN_MOOV.map((prefix) => `01${prefix}`), ...BENIN_MOOV],
    },
  },
  BFA: {
    dial: '226',
    keepsZero: true,
    channels: {
      ORANGE_BFA: ['05', '06', '07', '54', '55', '56', '57', '64', '65', '66', '67', '74', '75', '76', '77'],
      MOOV_BFA: ['01', '02', '03', '50', '51', '52', '53', '60', '61', '62', '63', '70', '71', '72', '73'],
    },
  },
  CIV: { dial: '225', keepsZero: true, channels: { ORANGE_CIV: ['07'], MTN_CIV: ['05'] } },
  SEN: { dial: '221', keepsZero: false, channels: { ORANGE_SEN: ['77', '78'], FREE_SEN: ['76'] } },
  GHA: {
    dial: '233',
    keepsZero: false,
    channels: { MTN_GHA: ['24', '25', '53', '54', '55', '59'], VODAFONE_GHA: ['20', '50'], AIRTELTIGO_GHA: ['26', '27', '56', '57'] },
  },
  NGA: {
    dial: '234',
    keepsZero: false,
    channels: {
      MTN_NGA: ['703', '704', '706', '707', '803', '806', '810', '813', '814', '816', '903', '906', '913', '916'],
      AIRTEL_NGA: ['701', '708', '802', '808', '812', '901', '902', '904', '907', '911', '912'],
    },
  },
  KEN: {
    dial: '254',
    keepsZero: false,
    channels: { MPESA_KEN: ['70', '71', '72', '740', '741', '742', '743', '745', '746', '748', '757', '758', '759', '768', '769', '79', '110', '111', '112', '113', '114', '115'] },
  },
  UGA: { dial: '256', keepsZero: false, channels: { MTN_UGA: ['76', '77', '78'], AIRTEL_UGA: ['70', '74', '75'] } },
  RWA: { dial: '250', keepsZero: false, channels: { MTN_RWA: ['78', '79'], AIRTEL_RWA: ['72', '73'] } },
  TZA: {
    dial: '255',
    keepsZero: false,
    channels: { VODACOM_TZA: ['74', '75', '76'], AIRTEL_TZA: ['68', '69', '78'], TIGO_TZA: ['65', '67', '71', '77'], HALOTEL_TZA: ['61', '62'] },
  },
  ZMB: { dial: '260', keepsZero: false, channels: { AIRTEL_ZMB: ['97', '77', '57'], MTN_ZMB: ['96', '76', '56'], ZAMTEL_ZMB: ['95', '75', '55'] } },
  COD: { dial: '243', keepsZero: false, channels: { MPESA_COD: ['81', '82', '83'], AIRTEL_COD: ['97', '98', '99'], ORANGE_COD: ['80', '84', '85', '89'] } },
  MWI: { dial: '265', keepsZero: false, channels: { AIRTEL_MWI: ['99'], TNM_MWI: ['88'] } },
  MOZ: { dial: '258', keepsZero: false, channels: { VODACOM_MOZ: ['84', '85'], MOVITEL_MOZ: ['86', '87'] } },
  ETH: { dial: '251', keepsZero: false, channels: { MPESA_ETH: ['7'] } },
  LSO: { dial: '266', keepsZero: false, channels: { MPESA_LSO: ['5'] } },
};

/** ISO-2 codes of the countries above, so callers can pass either form. */
const ISO2: Record<string, string> = {
  CM: 'CMR', GA: 'GAB', CG: 'COG', BJ: 'BEN', BF: 'BFA', CI: 'CIV', SN: 'SEN', GH: 'GHA', NG: 'NGA', KE: 'KEN',
  UG: 'UGA', RW: 'RWA', TZ: 'TZA', ZM: 'ZMB', CD: 'COD', MW: 'MWI', MZ: 'MOZ', ET: 'ETH', LS: 'LSO',
};

function national(digits: string, keepsZero: boolean): string {
  return !keepsZero && digits.startsWith('0') ? digits.slice(1) : digits;
}

/** [ISO-3 country, national number] for a phone, or [null, ''] when the country can't be told. */
function split(phone: string, country?: string | null): [string | null, string] {
  const trimmed = phone.trim();
  const international = trimmed.startsWith('+') || trimmed.startsWith('00');
  let digits = phone.replace(/\D/g, '');

  if (trimmed.startsWith('00')) {
    digits = digits.slice(2);
  }

  let iso = country ? country.trim().toUpperCase() : null;
  iso = iso && iso.length === 2 ? ISO2[iso] ?? null : iso;

  if (country && (!iso || !COUNTRIES[iso])) {
    return [null, ''];
  }

  if (!iso) {
    for (const [code, { dial, keepsZero }] of Object.entries(COUNTRIES)) {
      // A bare number without "+" only counts as international when it is long enough to hold one.
      if (digits.startsWith(dial) && (international || digits.length >= dial.length + 8)) {
        return [code, national(digits.slice(dial.length), keepsZero)];
      }
    }

    return [null, ''];
  }

  const { dial, keepsZero } = COUNTRIES[iso];

  if ((international || digits.length >= dial.length + 8) && digits.startsWith(dial)) {
    digits = digits.slice(dial.length);
  }

  return [iso, national(digits, keepsZero)];
}

/**
 * The channel code for a phone number, e.g. `detectChannel('024 123 4567', 'GH')` or
 * `detectChannel('+254712345678')`.
 *
 * @param country ISO-3 (`GHA`, as in `country_iso` from listChannels()) or ISO-2 (`GH`). Without it, the
 *                number must carry its country code (`+233…`, `00233…` or `233…`).
 */
export function detectChannel(phone: string, country?: string | null): string | null {
  const [iso, number] = split(phone, country);

  if (!iso || number === '') {
    return null;
  }

  let best: string | null = null;
  let bestLength = 0;

  for (const [channel, prefixes] of Object.entries(COUNTRIES[iso].channels)) {
    for (const prefix of prefixes) {
      if (prefix.length > bestLength && number.startsWith(prefix)) {
        best = channel;
        bestLength = prefix.length;
      }
    }
  }

  return best;
}

/** ISO-3 country of an international number (`+233…`), or null. */
export function detectCountry(phone: string): string | null {
  return split(phone)[0];
}
