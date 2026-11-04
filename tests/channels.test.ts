import axios from 'axios';
import { ElgioPayClient } from '../src/client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * channel_code support on payment + payout, and the listChannels() endpoint.
 * Axios is mocked so no real network traffic happens.
 */
describe('Channels & channel_code', () => {
  let post: jest.Mock;
  let get: jest.Mock;
  let client: ElgioPayClient;

  beforeEach(() => {
    post = jest.fn().mockResolvedValue({ data: { success: true } });
    get = jest.fn().mockResolvedValue({ data: { success: true, data: [] } });
    // axios.create() returns our fake instance.
    (mockedAxios.create as jest.Mock).mockReturnValue({
      post,
      get,
      defaults: {},
      interceptors: { response: { use: jest.fn() } },
    } as any);

    client = new ElgioPayClient({ apiKey: 'pk_test_x', environment: 'sandbox' });
  });

  test('payment accepts channel_code instead of payment_method', async () => {
    await client.initiatePayment({
      amount: 1000,
      channel_code: 'ORANGE_CMR',
      customer_phone: '+237699000000',
    });

    expect(post).toHaveBeenCalledWith('/api/v1/payments', expect.objectContaining({
      channel_code: 'ORANGE_CMR',
    }));
    const body = post.mock.calls[0][1];
    expect(body.payment_method).toBeUndefined();
  });

  test('payment still accepts a legacy payment_method', async () => {
    await client.initiatePayment({
      amount: 1000,
      payment_method: 'mtn_mobile_money',
      customer_phone: '+237677000000',
    });

    expect(post).toHaveBeenCalledWith('/api/v1/payments', expect.objectContaining({
      payment_method: 'mtn_mobile_money',
    }));
  });

  test('payment rejects when neither method nor channel is given', async () => {
    await expect(
      client.initiatePayment({ amount: 1000, customer_phone: '+237677000000' } as any)
    ).rejects.toThrow(/payment_method or channel_code/);
    expect(post).not.toHaveBeenCalled();
  });

  test('payout accepts channel_code', async () => {
    await client.createPayout({
      amount: 5000,
      channel_code: 'AIRTEL_GAB',
      recipient_name: 'Jean',
      recipient_phone: '074000000',
    });

    expect(post).toHaveBeenCalledWith('/api/v1/payouts', expect.objectContaining({
      channel_code: 'AIRTEL_GAB',
    }));
  });

  test('listChannels hits /channels with filters and returns the array', async () => {
    get.mockResolvedValueOnce({
      data: { success: true, data: [{ code: 'ORANGE_CMR', name: 'Orange Money (Cameroon)', type: 'mobile_money' }] },
    });

    const channels = await client.listChannels({ type: 'mobile_money', country: 'CMR' });

    expect(get).toHaveBeenCalledWith('/api/v1/channels', {
      params: { type: 'mobile_money', country: 'CMR' },
    });
    expect(channels[0].code).toBe('ORANGE_CMR');
  });
});
