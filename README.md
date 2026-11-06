# ElgioPay Node.js SDK

[![npm version](https://badge.fury.io/js/%40elgiosoft%2Felgiopay-sdk.svg)](https://badge.fury.io/js/%40elgiosoft%2Felgiopay-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

Node.js/TypeScript SDK for integrating with the ElgioPay API. Optimized for mobile money payments in Cameroon and West Africa.

## Features

- 🇨🇲 **Cameroon-First**: Optimized for XAF currency and Cameroon phone formats
- 📱 **Mobile Money**: MTN Mobile Money and Orange Money support
- 🔄 **Auto-Retry**: Built-in payment retry mechanism with exponential backoff
- ✅ **Phone Validation**: Automatic phone number normalization for Cameroon
- 🛡️ **Error Handling**: Comprehensive error handling with detailed messages
- 🔗 **TypeScript**: Full TypeScript support with type definitions
- 💰 **Multi-Currency**: Support for XAF, XOF, and EUR currencies
- 🧪 **Testing**: Built-in utilities for testing and development

## Installation

```bash
npm install @elgiosoft/elgiopay-sdk
```

## Requirements

- Node.js 16.0.0 or higher
- TypeScript 5.0+ (for TypeScript projects)

## Quick Start

### Using Environment Variables (Recommended)

Create a `.env` file in your project root:

```env
ELGIOPAY_API_KEY=pk_test_your_api_key
ELGIOPAY_ENV=sandbox
```

#### JavaScript (ES6+)

```javascript
const { ElgioPayClient } = require('@elgiosoft/elgiopay-sdk');

// Automatically reads from ELGIOPAY_API_KEY and ELGIOPAY_ENV
const client = new ElgioPayClient();

// Or with manual configuration:
// const client = new ElgioPayClient({
//   apiKey: 'pk_test_your_api_key',
//   environment: 'sandbox'
// });

// Create payment
async function createPayment() {
  try {
    const result = await client.initiatePayment({
      amount: 5000, // 5000 XAF
      currency: 'XAF',
      payment_method: 'mtn_mobile_money',
      customer_phone: '+237677123456',
      customer_name: 'Jean Dupont',
      reference: 'FACTURE-001',
    });

    console.log('Payment created:', result.transaction_id);
  } catch (error) {
    console.error('Payment failed:', error.message);
  }
}
```

#### TypeScript

```typescript
import { ElgioPayClient, ElgioPayConfig, PaymentResponse } from '@elgiosoft/elgiopay-sdk';

// Using environment variables
const client = new ElgioPayClient();

// Or with manual configuration:
// const config: ElgioPayConfig = {
//   apiKey: 'pk_test_your_api_key',
//   environment: 'sandbox'
// };
// const client = new ElgioPayClient(config);

async function createPayment(): Promise<void> {
  try {
    const result: PaymentResponse = await client.initiatePayment({
      amount: 5000,
      currency: 'XAF',
      payment_method: 'mtn_mobile_money',
      customer_phone: '+237677123456',
      customer_name: 'Jean Dupont',
      reference: 'FACTURE-001',
    });

    console.log('Payment created:', result.transaction_id);
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
```

## API Reference

### Client Configuration

```typescript
const client = new ElgioPayClient({
  apiKey: 'your_api_key',        // Required — falls back to ELGIOPAY_API_KEY env var
  environment: 'sandbox',        // Optional — 'sandbox' | 'prod' (default: 'prod')
  timeout: 30000,                // Optional — request timeout in ms (default: 30000)
});
```

### Payment Methods

Every payment — MTN, Orange, current markets and any we add later — goes
through a single method: `initiatePayment()`. Pick the `payment_method`
you need and pass a `PaymentData` payload.

```typescript
// Signature
client.initiatePayment(paymentData: PaymentData): Promise<PaymentResponse>

// PaymentData
interface PaymentData {
  amount: number;
  currency?: Currency;               // XAF | XOF | EUR | USD
  payment_method?: PaymentMethod;    // mtn_mobile_money | orange_money
  channel_code?: string;             // e.g. ORANGE_CMR — alternative to payment_method
  customer_phone: string;            // E.164, e.g. +237677123456
  customer_name?: string;
  customer_email?: string;
  reference?: string;
  metadata?: Record<string, any>;
  /** Optional surcharge routed to the SURCHARGE wallet — see billing profile. */
  surcharge?: number;
}
```

Provide **either** `payment_method` **or** `channel_code` (a code from
`listChannels()`). With `channel_code`, the currency is taken from the channel:

```typescript
const payment = await client.initiatePayment({
  amount: 1000,
  channel_code: 'ORANGE_CMR',
  customer_phone: '+237699000000',
});
```

#### MTN Mobile Money (Cameroon)

```typescript
const payment = await client.initiatePayment({
  amount: 1000,
  currency: 'XAF',
  payment_method: 'mtn_mobile_money',
  customer_phone: '+237677123456',
  customer_name: 'Jean Dupont',
  customer_email: 'jean@example.com',
  reference: 'ORDER-123',
  metadata: { order_id: 456, product: 'Premium Plan' },
});
```

#### Orange Money (Cameroon)

```typescript
const payment = await client.initiatePayment({
  amount: 2500,
  currency: 'XAF',
  payment_method: 'orange_money',
  customer_phone: '+237677123456',
  customer_name: 'Marie Ngozi',
  reference: 'INV-789',
});
```

#### Normalising Cameroon phone numbers

If your customer input arrives in mixed formats (`677…`, `237…`,
`+237…`), pipe it through `normalizeCameroonPhone()` before calling
`initiatePayment()`.

```typescript
import { normalizeCameroonPhone } from '@elgiosoft/elgiopay-sdk';

const payment = await client.initiatePayment({
  amount: 1000,
  currency: 'XAF',
  payment_method: 'mtn_mobile_money',
  customer_phone: normalizeCameroonPhone('677123456'), // → +237677123456
});
```

### Channels

List the payment channels available to your app (mobile money, bills, cash-in).
Pass a channel's `code` as `channel_code` on `initiatePayment()` /
`createPayout()`. The provider that fulfils a channel is internal and never
returned.

```typescript
// All channels
const channels = await client.listChannels();

// Filtered: payout-capable mobile-money channels in Cameroon
const payoutChannels = await client.listChannels({
  type: 'mobile_money',
  direction: 'payout',
  country: 'CMR',
});
// → [{ code: 'ORANGE_CMR', name: 'Orange Money (Cameroon)', currency: 'XAF', ... }]

// Filters: { type?, direction?, country? (ISO-3), category?, name? }
```

#### Detecting the channel from a phone number

`detectChannel()` guesses the mobile-money channel from the operator prefix,
so you can pre-select it in your checkout. It runs locally (no API call).

```typescript
import { detectChannel, detectCountry } from '@elgiosoft/elgiopay-sdk';

detectChannel('+237677123456');      // → 'MTN_CMR'
detectChannel('024 123 4567', 'GH'); // → 'MTN_GHA' (ISO-2 or ISO-3 country)
detectChannel('+237123');            // → null (operator unknown)
detectCountry('+254712345678');      // → 'KEN'
```

Numbers can be ported between operators, and some wallets work on any
number, so treat the result as a default the customer can change. It returns
`null` rather than guessing when the country or operator can't be told.

### Connected Merchants (platform apps)

If your merchant is a **platform**, you can onboard sub-merchants, charge on
their behalf and settle them. Two things must both be true or the API answers
`403 NOT_A_PLATFORM`: the merchant is a platform, *and* the specific app whose
key you're using is flagged as a platform app. A platform's own storefront app
is deliberately not one.

A connected merchant lives inside exactly one app: the app whose key created
it. There's no app parameter, and a merchant created with app A's key is
invisible to app B's key — listing, lookup, balance, payouts and
`sub_merchant_id` charges are all scoped to the calling app.

```typescript
// 1. Onboard. Provide `email` plus company_name OR first_name.
const merchant = await client.connectedMerchants.create({
  email: 'shop@example.cm',
  company_name: 'Boutique Mballa',
  metadata: { external_id: 'shop_42' },
});
// → { merchant_id: 'mch_…', kyc_status: 'pending', onboarding_url: 'https://…/onboard/…', … }

// 2. Send them to `onboarding_url` to complete their own KYC. You deliver the
//    link however you already reach them — elgiopay does not email your
//    merchants. It's single-use and valid 24h: opening it starts their session
//    and spends the link, so a forwarded copy won't work afterwards.
//
//    That URL is returned ONLY by the call that mints it. Nothing reads it
//    back; if you lose it, or it expired unopened, mint another:
const { onboarding_url } = await client.connectedMerchants.createOnboardingLink(
  merchant.merchant_id,
);

//    Track progress via connected_merchant.kyc.submitted / .approved /
//    .rejected, or read the link's state — never the token itself:
const { onboarding } = await client.connectedMerchants.get(merchant.merchant_id);
// → { link_pending: true, link_expires_at: '…', link_opened_at: null }

// 3. Charge on its behalf — the net amount credits ITS balance, not your float.
await client.initiatePayment({
  amount: 5000,
  payment_method: 'mtn_mobile_money',
  customer_phone: '+237677389120',
  sub_merchant_id: merchant.merchant_id,
});

// Card charges route the same way. The card settlement hold applies to the
// sub-merchant's ledger rather than your float.
await client.cards.processPayment({
  amount: 100,
  currency: 'USD',
  customer_name: 'Marie Tchana',
  payment_method_id: 'pm_123',
  sub_merchant_id: merchant.merchant_id,
});

// 4. Read and settle.
const balance = await client.connectedMerchants.getBalance(merchant.merchant_id);
await client.connectedMerchants.createPayout(merchant.merchant_id, {
  amount: 4000,
  payout_method: 'mtn_mobile_money',
  recipient_name: 'Jean Mballa',
  recipient_phone: '677389120',
});

// Listing + lifecycle
const { data, meta } = await client.connectedMerchants.list({ per_page: 25 });
await client.connectedMerchants.get(merchant.merchant_id);
await client.connectedMerchants.deactivate(merchant.merchant_id); // freeze
await client.connectedMerchants.reactivate(merchant.merchant_id);
```

Branch on the machine-readable code rather than the message:

```typescript
try {
  await client.connectedMerchants.create({ email: 'shop@example.cm' });
} catch (e) {
  if (e instanceof ElgioPayError && e.errorCode === 'NOT_A_PLATFORM') {
    // This app's merchant isn't a platform.
  }
}
```

Codes: `NOT_A_PLATFORM`, `NOT_YOUR_MERCHANT`, `MERCHANT_INACTIVE`,
`KYC_ALREADY_APPROVED`, `PAYOUT_FAILED`, `VALIDATION_ERROR`, and on a charge —
`SUB_MERCHANT_NOT_FOUND` / `_NOT_CONNECTED` / `_NOT_YOURS` / `_INACTIVE`.

Webhooks (`connected_merchant.created`, `.kyc.submitted`, `.kyc.approved`,
`.kyc.rejected`, `.payout.paid`, `.payout.failed`, `.deactivated`,
`.reactivated`) are delivered to the **platform's** webhook URL, never the
sub-merchant's. See `WebhookEvents.CONNECTED_MERCHANT_*`.

> **Two things to know.** A connected merchant can verify itself through the
> hosted link, but it still has no login — it cannot sign in to a dashboard, and
> everything else about it is managed through your platform key. And
> `capabilities` is advisory: both flags are reported `true` for every connected
> merchant regardless of KYC, because the charge path doesn't check it. Don't use
> them to decide whether you may charge — and note a payout for an unverified
> merchant can still be refused by the KYC amount caps despite
> `payouts_enabled: true`.

### Payout fees

Payout fees are charged on top of the amount: the recipient gets
`amount.total`, and your balance is debited `amount.total_debited`
(`total + fees`).

```typescript
const payout = await client.createPayout({ /* ... */ });
payout.amount; // → { total: 5000, currency: 'XAF', fees: 100, total_debited: 5100 }
```

### Payment Status and Verification

```typescript
// Get payment status
const status = await client.getPaymentStatus('txn_abc123');
console.log('Status:', status.status); // 'pending', 'completed', 'failed', etc.

// Verify payment
const verification = await client.verifyPayment('txn_abc123');
if (verification.verified) {
  console.log('Payment verified successfully!');
}
```

### Error Handling

```typescript
import { ElgioPayError } from '@elgiosoft/elgiopay-sdk';

try {
  const result = await client.initiatePayment({
    amount: 50,
    currency: 'XAF',
    payment_method: 'mtn_mobile_money',
    customer_phone: 'invalid-phone',
  });
} catch (error) {
  if (error instanceof ElgioPayError) {
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('API response:', error.response);
  }
}
```

### Retry Mechanism

```typescript
// Automatic retry with exponential backoff
const result = await client.createPaymentWithRetry({
  amount: 1000,
  payment_method: 'mtn_mobile_money',
  customer_phone: '+237677123456',
  currency: 'XAF'
}, 3); // max 3 retries
```

## Utilities

### Phone Number Utilities

```typescript
import { normalizeCameroonPhone, isValidCameroonPhone } from '@elgiosoft/elgiopay-sdk';

// Normalize phone numbers
const normalized = normalizeCameroonPhone('677123456'); // '+237677123456'
const normalized2 = normalizeCameroonPhone('237677123456'); // '+237677123456'

// Validate phone numbers
const isValid = isValidCameroonPhone('+237677123456'); // true
const isInvalid = isValidCameroonPhone('123456789'); // false
```

### Amount Utilities

```typescript
import { validateAmount, formatAmount } from '@elgiosoft/elgiopay-sdk';

// Validate amounts (minimum 100 XAF)
const isValidAmount = validateAmount(1000, 'XAF'); // true
const isInvalidAmount = validateAmount(50, 'XAF'); // false

// Format amounts for display
const formatted = formatAmount(5000, 'XAF'); // "5 000 FCFA"
```

## Environment Configuration

### Development/Testing

```typescript
const client = new ElgioPayClient({
  apiKey: 'pk_test_your_sandbox_key',
  environment: 'sandbox',
});
```

### Production

```typescript
const client = new ElgioPayClient({
  apiKey: 'pk_live_your_live_key',
  environment: 'prod',
});
```

### Environment Variables

```bash
# .env file
ELGIOPAY_API_KEY=pk_test_your_api_key
ELGIOPAY_ENV=sandbox
```

```typescript
// Both are picked up automatically — no config needed.
const client = new ElgioPayClient();
```

## Testing

### Getting API Keys

1. Sign up at [sandbox.elgiopay.com](https://sandbox.elgiopay.com)
2. Create a new application
3. Copy your API keys:
   - `pk_test_...` for sandbox
   - `pk_live_...` for production

### Test Phone Numbers

For sandbox testing, use these test phone numbers:
- MTN: `677123456`, `677123457`, `677123458`
- Orange: `677123456`, `677123457`, `677123458`

All sandbox payments will automatically succeed after a few seconds.

### Example Test

```typescript
import { ElgioPayClient } from '@elgiosoft/elgiopay-sdk';

describe('ElgioPay', () => {
  const client = new ElgioPayClient({
    apiKey: 'pk_test_sandbox_key',
    environment: 'sandbox',
  });

  it('should create MTN payment', async () => {
    const result = await client.initiatePayment({
      amount: 1000,
      currency: 'XAF',
      payment_method: 'mtn_mobile_money',
      customer_phone: '+237677123456',
      reference: 'TEST-001',
    });

    expect(result.success).toBe(true);
    expect(result.transaction_id).toBeDefined();
  });
});
```

## Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid data |
| 401  | Unauthorized - Invalid API key |
| 402  | Payment Required - Insufficient funds |
| 404  | Not Found - Transaction not found |
| 422  | Validation Error - Invalid input |
| 500  | Server Error - Internal error |

## Supported Countries & Currencies

| Country | Currency | MTN | Orange |
|---------|----------|-----|--------|
| Cameroon | XAF | ✅ | ✅ |
| Côte d'Ivoire | XOF | ✅ | ✅ |
| Burkina Faso | XOF | ✅ | ✅ |
| Ghana | GHS | ✅ | ❌ |
| Mali | XOF | ❌ | ✅ |
| Senegal | XOF | ❌ | ✅ |

## Webhooks

Set up webhooks to receive payment status updates:

```typescript
// Express.js webhook handler
app.post('/webhooks/elgiopay', (req, res) => {
  const { transaction_id, status, amount } = req.body;
  
  if (status === 'completed') {
    // Payment successful
    console.log(`Payment ${transaction_id} completed: ${amount} XAF`);
    // Update your database
  } else if (status === 'failed') {
    // Payment failed
    console.log(`Payment ${transaction_id} failed`);
  }
  
  res.status(200).send('OK');
});
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions:

```typescript
import {
  ElgioPayClient,
  PaymentResponse,
  PaymentStatusResponse,
  ElgioPayError,
  Currency,
  PaymentMethod
} from '@elgiosoft/elgiopay-sdk';

// All types are fully typed
const client: ElgioPayClient = new ElgioPayClient({ apiKey: 'key' });
const payment: PaymentResponse = await client.initiatePayment({
  amount: 1000,
  currency: 'XAF',
  payment_method: 'mtn_mobile_money',
  customer_phone: '+237677123456',
});
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## Support

- 📖 **Documentation**: [https://docs.elgiopay.com](https://docs.elgiopay.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/elgiosoft/elgiopay-sdk-node/issues)
- 💬 **Support**: [developers@elgiosoft.com](mailto:developers@elgiosoft.com)
- 🌐 **Website**: [https://elgiopay.com](https://elgiopay.com)

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## About Elgiosoft

This SDK is developed by [Elgiosoft Ltd](https://elgiosoft.com), a leading fintech company specializing in mobile money solutions for Africa.