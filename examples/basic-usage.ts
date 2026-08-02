import { ElgioPayClient, ElgioPayError } from '../src';

// Example: Basic usage of ElgioPay Payment SDK
// Make sure to set ELGIOPAY_API_KEY and ELGIOPAY_ENV in your .env file
async function basicUsageExample() {
  console.log('🚀 ElgioPay Payment SDK - Basic Usage Example\n');

  // Initialize client - will read from environment variables
  // ELGIOPAY_API_KEY and ELGIOPAY_ENV
  const client = new ElgioPayClient();
  
  // Or you can still pass config explicitly:
  // const client = new ElgioPayClient({
  //   apiKey: 'pk_test_your_api_key',
  //   environment: 'sandbox'
  // });

  try {
    console.log('📱 Creating MTN Mobile Money payment...');
    
    // Create MTN payment for Cameroon
    const mtnPayment = await client.createMTNCameroonPayment(
      5000, // 5000 XAF
      '677123456',
      {
        customer_name: 'Jean Dupont',
        customer_email: 'jean.dupont@example.com',
        reference: 'FACTURE-001',
        metadata: {
          order_id: 12345,
          product: 'Premium Subscription'
        }
      }
    );

    console.log('✅ MTN Payment created successfully!');
    console.log(`   Transaction ID: ${mtnPayment.transaction_id}`);
    console.log(`   Status: ${mtnPayment.status}`);
    console.log(`   Message: ${mtnPayment.message}\n`);

    // Get payment status
    console.log('📊 Checking payment status...');
    const status = await client.getPaymentStatus(mtnPayment.transaction_id);
    console.log(`   Current status: ${status.status}`);
    console.log(`   Amount: ${status.amount} ${status.currency}\n`);

    // Create Orange Money payment
    console.log('🍊 Creating Orange Money payment...');
    const orangePayment = await client.createOrangeCameroonPayment(
      2500, // 2500 XAF
      '+237677123457',
      {
        customer_name: 'Marie Ngozi',
        reference: 'INV-002'
      }
    );

    console.log('✅ Orange Payment created successfully!');
    console.log(`   Transaction ID: ${orangePayment.transaction_id}`);
    console.log(`   Status: ${orangePayment.status}\n`);

    // Verify a payment
    console.log('🔍 Verifying payment...');
    const verification = await client.verifyPayment(mtnPayment.transaction_id);
    console.log(`   Verified: ${verification.verified}`);
    console.log(`   Status: ${verification.status}\n`);

  } catch (error) {
    if (error instanceof ElgioPayError) {
      console.error('❌ ElgioPay Error:', error.message);
      console.error('   Code:', error.code);
      if (error.response) {
        console.error('   Response:', error.response);
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Example: Payment with retry
async function retryExample() {
  console.log('🔄 Payment with Retry Example\n');

  // Initialize client using environment variables
  const client = new ElgioPayClient();

  try {
    console.log('🔄 Creating payment with retry mechanism...');
    
    const result = await client.createPaymentWithRetry({
      amount: 1000,
      payment_method: 'mtn_mobile_money',
      customer_phone: '+237677123456',
      currency: 'XAF',
      customer_name: 'Test User',
      reference: 'RETRY-TEST-001'
    }, 3); // Max 3 retries

    console.log('✅ Payment with retry successful!');
    console.log(`   Transaction ID: ${result.transaction_id}`);

  } catch (error) {
    console.error('❌ Payment failed after retries:', error);
  }
}

// Example: Utility functions
async function utilityExample() {
  console.log('🛠️  Utility Functions Example\n');

  const { 
    normalizeCameroonPhone, 
    isValidCameroonPhone, 
    validateAmount, 
    formatAmount 
  } = await import('../src/utils');

  // Phone number utilities
  console.log('📞 Phone Number Utilities:');
  const phone1 = normalizeCameroonPhone('677123456');
  const phone2 = normalizeCameroonPhone('237677123456');
  const phone3 = normalizeCameroonPhone('+237677123456');
  
  console.log(`   677123456 → ${phone1}`);
  console.log(`   237677123456 → ${phone2}`);
  console.log(`   +237677123456 → ${phone3}`);
  
  console.log(`   Is valid: ${isValidCameroonPhone(phone1)}\n`);

  // Amount utilities
  console.log('💰 Amount Utilities:');
  console.log(`   1000 XAF valid: ${validateAmount(1000, 'XAF')}`);
  console.log(`   50 XAF valid: ${validateAmount(50, 'XAF')}`);
  console.log(`   Formatted 5000 XAF: ${formatAmount(5000, 'XAF')}\n`);
}

// Run examples
async function runExamples() {
  console.log('🎯 ElgioPay Payment SDK Examples\n');
  console.log('═'.repeat(50));
  
  await basicUsageExample();
  console.log('═'.repeat(50));
  
  await retryExample();
  console.log('═'.repeat(50));
  
  await utilityExample();
  console.log('═'.repeat(50));
  
  console.log('✨ All examples completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { basicUsageExample, retryExample, utilityExample };