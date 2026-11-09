import axios from 'axios';
import { ElgioPayClient } from '../src/client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Card-payment sub-client (`client.cards`), including `sub_merchant_id` —
 * card charges route to a connected merchant the same way mobile money does.
 * Axios is mocked so no real network traffic happens.
 */
describe('Cards', () => {
  let post: jest.Mock;
  let client: ElgioPayClient;

  beforeEach(() => {
    post = jest.fn().mockResolvedValue({ data: { success: true } });
    (mockedAxios.create as jest.Mock).mockReturnValue({
      post,
      get: jest.fn(),
      defaults: {},
      interceptors: { response: { use: jest.fn() } },
    } as any);

    client = new ElgioPayClient({ apiKey: 'pk_test_x', environment: 'sandbox' });
  });

  test('initialize hits the init endpoint', async () => {
    post.mockResolvedValueOnce({ data: { app_id: 'pk_live_abc' } });

    const init = await client.cards.initialize();

    expect(post).toHaveBeenCalledWith('/api/v1/card-payment/init');
    expect(init.app_id).toBe('pk_live_abc');
  });

  test('processPayment posts the charge payload', async () => {
    post.mockResolvedValueOnce({ data: { success: true, message: 'Payment successful' } });

    await client.cards.processPayment({
      amount: 100,
      currency: 'USD',
      customer_name: 'Marie Tchana',
      payment_method_id: 'pm_123',
    });

    expect(post).toHaveBeenCalledWith('/api/v1/card-payment/process', expect.objectContaining({
      amount: 100,
      currency: 'USD',
      payment_method_id: 'pm_123',
    }));
  });

  test('a card charge can be attributed to a sub-merchant', async () => {
    await client.cards.processPayment({
      amount: 100,
      currency: 'USD',
      customer_name: 'Marie Tchana',
      payment_method_id: 'pm_123',
      sub_merchant_id: 'mch_abc',
    });

    expect(post).toHaveBeenCalledWith('/api/v1/card-payment/process', expect.objectContaining({
      sub_merchant_id: 'mch_abc',
    }));
  });

  test('a card charge without sub_merchant_id stays unattributed', async () => {
    await client.cards.processPayment({
      amount: 100,
      currency: 'USD',
      customer_name: 'Marie Tchana',
    });

    expect(post.mock.calls[0][1].sub_merchant_id).toBeUndefined();
  });

  test('confirmPayment reconciles after 3DS', async () => {
    post.mockResolvedValueOnce({ data: { success: true, message: 'Payment successful' } });

    await client.cards.confirmPayment({
      transaction_id: 'CARD_ABC',
      payment_intent_id: 'pi_123',
    });

    expect(post).toHaveBeenCalledWith('/api/v1/card-payment/confirm', expect.objectContaining({
      transaction_id: 'CARD_ABC',
      payment_intent_id: 'pi_123',
    }));
  });

  test('the sub-client is memoized', () => {
    expect(client.cards).toBe(client.cards);
  });
});
