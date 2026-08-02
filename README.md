# ElgioPay Node.js SDK

[![npm version](https://badge.fury.io/js/%40elgiosoft%2Fsofipayments-sdk.svg)](https://badge.fury.io/js/%40elgiosoft%2Fsofipayments-sdk)
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
    const result = await client.createMTNCameroonPayment(
      5000, // 5000 XAF
      '677123456', // or '+237677123456'
      {
        customer_name: 'Jean Dupont',
        reference: 'FACTURE-001'
      }
    );
    
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
    const result: PaymentResponse = await client.createMTNCameroonPayment(
      5000,
      '677123456',
      {
        customer_name: 'Jean Dupont',
        reference: 'FACTURE-001'
      }
    );
    
    console.log('Payment created:', result.transaction_id);
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
```

## API Reference

### Client Configuration

```typescript
const client = new SofiClient({
  apiKey: 'your_api_key',        // Required: Your Sofi API key
  baseURL: 'https://api.sofipayments.com', // Optional: API base URL
  timeout: 30000                 // Optional: Request timeout in ms
});
```

### Payment Methods

#### MTN Mobile Money (Cameroon)

```typescript
// Cameroon-optimized method
const result = await client.createMTNCameroonPayment(
  amount: number,
  customerPhone: string,
  options?: {
    customer_name?: string;
    customer_email?: string;
    reference?: string;
    metadata?: Record<string, any>;
  }
);

// Example
const payment = await client.createMTNCameroonPayment(
  1000,
  '677123456',
  {
    customer_name: 'Jean Dupont',
    customer_email: 'jean@example.com',
    reference: 'ORDER-123',
    metadata: { order_id: 456, product: 'Premium Plan' }
  }
);
```

#### Orange Money (Cameroon)

```typescript
const result = await client.createOrangeCameroonPayment(
  2500,
  '+237677123456',
  {
    customer_name: 'Marie Ngozi',
    reference: 'INV-789'
  }
);
```

#### Generic Payment

```typescript
const result = await client.initiatePayment({
  amount: 5000,
  currency: 'XAF',
  payment_method: 'mtn_mobile_money',
  customer_phone: '+237677123456',
  customer_name: 'Jean Dupont',
  reference: 'CUSTOM-REF'
});
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
import { SofiError } from '@elgiosoft/sofipayments-sdk';

try {
  const result = await client.createMTNCameroonPayment(50, 'invalid-phone');
} catch (error) {
  if (error instanceof SofiError) {
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
import { normalizeCameroonPhone, isValidCameroonPhone } from '@elgiosoft/sofipayments-sdk';

// Normalize phone numbers
const normalized = normalizeCameroonPhone('677123456'); // '+237677123456'
const normalized2 = normalizeCameroonPhone('237677123456'); // '+237677123456'

// Validate phone numbers
const isValid = isValidCameroonPhone('+237677123456'); // true
const isInvalid = isValidCameroonPhone('123456789'); // false
```

### Amount Utilities

```typescript
import { validateAmount, formatAmount } from '@elgiosoft/sofipayments-sdk';

// Validate amounts (minimum 100 XAF)
const isValidAmount = validateAmount(1000, 'XAF'); // true
const isInvalidAmount = validateAmount(50, 'XAF'); // false

// Format amounts for display
const formatted = formatAmount(5000, 'XAF'); // "5 000 FCFA"
```

## Environment Configuration

### Development/Testing

```typescript
const client = new SofiClient({
  apiKey: 'pk_test_your_sandbox_key',
  baseURL: 'https://sandbox-api.sofipayments.com'
});
```

### Production

```typescript
const client = new SofiClient({
  apiKey: 'pk_live_your_live_key',
  baseURL: 'https://api.sofipayments.com'
});
```

### Environment Variables

```bash
# .env file
SOFI_API_KEY=pk_test_your_api_key
SOFI_BASE_URL=https://sandbox-api.sofipayments.com
```

```typescript
const client = new SofiClient({
  apiKey: process.env.SOFI_API_KEY!,
  baseURL: process.env.SOFI_BASE_URL
});
```

## Testing

### Test Phone Numbers

For sandbox testing, use these test phone numbers:
- MTN: `677123456`, `677123457`, `677123458`
- Orange: `677123456`, `677123457`, `677123458`

All sandbox payments will automatically succeed after a few seconds.

### Example Test

```typescript
import { SofiClient } from '@elgiosoft/sofipayments-sdk';

describe('Sofi Payments', () => {
  const client = new SofiClient({
    apiKey: 'pk_test_sandbox_key',
    baseURL: 'https://sandbox-api.sofipayments.com'
  });

  it('should create MTN payment', async () => {
    const result = await client.createMTNCameroonPayment(
      1000,
      '677123456',
      { reference: 'TEST-001' }
    );
    
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
app.post('/webhooks/sofi', (req, res) => {
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
  SofiClient,
  PaymentResponse,
  PaymentStatusResponse,
  SofiError,
  Currency,
  PaymentMethod
} from '@elgiosoft/sofipayments-sdk';

// All types are fully typed
const client: SofiClient = new SofiClient({ apiKey: 'key' });
const payment: PaymentResponse = await client.createMTNCameroonPayment(1000, '677123456');
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## Support

- 📖 **Documentation**: [https://docs.sofipayments.com](https://docs.sofipayments.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/elgiosoft/sofipayments-sdk-node/issues)
- 💬 **Support**: [developers@elgiosoft.com](mailto:developers@elgiosoft.com)
- 🌐 **Website**: [https://sofipayments.com](https://sofipayments.com)

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## About Elgiosoft

This SDK is developed by [Elgiosoft Ltd](https://elgiosoft.com), a leading fintech company specializing in mobile money solutions for Africa.