import axios from 'axios';
import { ElgioPayClient } from '../src/client';
import { ElgioPayError } from '../src/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Connected-merchant (platform) surface: onboarding, lifecycle, balance,
 * payouts, plus `sub_merchant_id` routing on a charge.
 * Axios is mocked so no real network traffic happens.
 */
describe('Connected merchants', () => {
  let post: jest.Mock;
  let get: jest.Mock;
  let client: ElgioPayClient;

  beforeEach(() => {
    post = jest.fn().mockResolvedValue({ data: { success: true } });
    get = jest.fn().mockResolvedValue({ data: { data: [], meta: {} } });
    (mockedAxios.create as jest.Mock).mockReturnValue({
      post,
      get,
      defaults: {},
      interceptors: { response: { use: jest.fn() } },
    } as any);

    client = new ElgioPayClient({ apiKey: 'pk_test_x', environment: 'sandbox' });
  });

  test('create posts the onboarding payload and returns the merchant id', async () => {
    post.mockResolvedValueOnce({
      data: {
        merchant_id: 'mch_abc',
        type: 'connected',
        kyc_status: 'pending',
        capabilities: { charges_enabled: false, payouts_enabled: false },
        onboarding_url: 'https://elgiopay.com/onboard/tok_40_chars',
        onboarding_expires_at: '2026-09-28T09:00:00+00:00',
        status: 'created',
      },
    });

    const created = await client.connectedMerchants.create({
      email: 'shop@example.cm',
      company_name: 'Boutique Mballa',
      country: 'CM',
    });

    expect(post).toHaveBeenCalledWith('/api/v1/connected-merchants', {
      email: 'shop@example.cm',
      company_name: 'Boutique Mballa',
      country: 'CM',
    });
    expect(created.merchant_id).toBe('mch_abc');
    expect(created.kyc_status).toBe('pending');
    expect(created.capabilities.charges_enabled).toBe(false);
    // The hosted KYC link is only ever returned here — a caller that drops it
    // has to mint a new one.
    expect(created.onboarding_url).toBe('https://elgiopay.com/onboard/tok_40_chars');
    expect(created.onboarding_expires_at).toBe('2026-09-28T09:00:00+00:00');
  });

  test('createOnboardingLink posts to the merchant and returns a fresh url', async () => {
    post.mockResolvedValueOnce({
      data: {
        merchant_id: 'mch_abc',
        onboarding_url: 'https://elgiopay.com/onboard/tok_replacement',
        onboarding_expires_at: '2026-09-29T09:00:00+00:00',
      },
    });

    const link = await client.connectedMerchants.createOnboardingLink('mch_abc');

    expect(post).toHaveBeenCalledWith('/api/v1/connected-merchants/mch_abc/onboarding-link');
    expect(link.onboarding_url).toContain('/onboard/');
  });

  test('detail exposes onboarding link state without the token', async () => {
    get.mockResolvedValueOnce({
      data: {
        merchant_id: 'mch_abc',
        type: 'connected',
        company_name: 'Boutique Mballa',
        kyc_status: 'pending',
        capabilities: { charges_enabled: true, payouts_enabled: true },
        onboarding: {
          link_pending: true,
          link_expires_at: '2026-09-28T09:00:00+00:00',
          link_opened_at: null,
        },
        created_at: '2026-09-27T09:00:00+00:00',
      },
    });

    const merchant = await client.connectedMerchants.get('mch_abc');

    expect(merchant.onboarding.link_pending).toBe(true);
    expect(merchant.onboarding.link_opened_at).toBeNull();
  });

  test('list passes pagination params and returns data + meta', async () => {
    get.mockResolvedValueOnce({
      data: {
        data: [{ merchant_id: 'mch_abc', type: 'connected', company_name: 'Boutique' }],
        meta: { current_page: 1, last_page: 3, total: 55 },
      },
    });

    const page = await client.connectedMerchants.list({ per_page: 20, page: 1 });

    expect(get).toHaveBeenCalledWith('/api/v1/connected-merchants', {
      params: { per_page: 20, page: 1 },
    });
    expect(page.data[0].merchant_id).toBe('mch_abc');
    expect(page.meta.total).toBe(55);
  });

  test('get fetches one merchant by uid', async () => {
    get.mockResolvedValueOnce({
      data: { merchant_id: 'mch_abc', type: 'connected', kyc_status: 'approved' },
    });

    const merchant = await client.connectedMerchants.get('mch_abc');

    expect(get).toHaveBeenCalledWith('/api/v1/connected-merchants/mch_abc');
    expect(merchant.kyc_status).toBe('approved');
  });

  test('getBalance defaults to XAF and hits the balance endpoint', async () => {
    get.mockResolvedValueOnce({
      data: {
        merchant_id: 'mch_abc',
        currency: 'XAF',
        balance: 12000,
        available_balance: 9000,
        reserved_balance: 3000,
      },
    });

    const balance = await client.connectedMerchants.getBalance('mch_abc');

    expect(get).toHaveBeenCalledWith('/api/v1/connected-merchants/mch_abc/balance', {
      params: { currency: 'XAF' },
    });
    expect(balance.available_balance).toBe(9000);
  });

  test('getBalance honours an explicit currency', async () => {
    await client.connectedMerchants.getBalance('mch_abc', 'EUR');

    expect(get).toHaveBeenCalledWith('/api/v1/connected-merchants/mch_abc/balance', {
      params: { currency: 'EUR' },
    });
  });

  test('createPayout posts to the merchant-scoped payout endpoint', async () => {
    post.mockResolvedValueOnce({
      data: {
        payout_id: 'po_1',
        merchant_id: 'mch_abc',
        amount: 5000,
        currency: 'XAF',
        status: 'processing',
      },
    });

    const payout = await client.connectedMerchants.createPayout('mch_abc', {
      amount: 5000,
      payout_method: 'mtn_mobile_money',
      recipient_name: 'Jean Mballa',
      recipient_phone: '677389120',
    });

    expect(post).toHaveBeenCalledWith(
      '/api/v1/connected-merchants/mch_abc/payouts',
      expect.objectContaining({ amount: 5000, payout_method: 'mtn_mobile_money' }),
    );
    expect(payout.payout_id).toBe('po_1');
  });

  test('deactivate and reactivate hit their endpoints', async () => {
    post.mockResolvedValueOnce({
      data: { merchant_id: 'mch_abc', is_active: false, status: 'deactivated' },
    });
    const off = await client.connectedMerchants.deactivate('mch_abc');
    expect(post).toHaveBeenCalledWith('/api/v1/connected-merchants/mch_abc/deactivate');
    expect(off.is_active).toBe(false);

    post.mockResolvedValueOnce({
      data: { merchant_id: 'mch_abc', is_active: true, status: 'reactivated' },
    });
    const on = await client.connectedMerchants.reactivate('mch_abc');
    expect(post).toHaveBeenCalledWith('/api/v1/connected-merchants/mch_abc/reactivate');
    expect(on.is_active).toBe(true);
  });

  test('a charge can be attributed to a sub-merchant', async () => {
    await client.initiatePayment({
      amount: 5000,
      payment_method: 'mtn_mobile_money',
      customer_phone: '+237677389120',
      sub_merchant_id: 'mch_abc',
    });

    expect(post).toHaveBeenCalledWith('/api/v1/payments', expect.objectContaining({
      sub_merchant_id: 'mch_abc',
    }));
  });

  test('a charge without sub_merchant_id stays unattributed', async () => {
    await client.initiatePayment({
      amount: 5000,
      payment_method: 'mtn_mobile_money',
      customer_phone: '+237677389120',
    });

    expect(post.mock.calls[0][1].sub_merchant_id).toBeUndefined();
  });

  test('ElgioPayError exposes the API error code for branching', () => {
    const err = new ElgioPayError('This endpoint requires a platform merchant’s API key.', 403, {
      error: 'NOT_A_PLATFORM',
      message: 'This endpoint requires a platform merchant’s API key.',
    });

    expect(err.errorCode).toBe('NOT_A_PLATFORM');
    expect(err.code).toBe(403);
  });

  test('ElgioPayError.errorCode is undefined when the API sent no code', () => {
    expect(new ElgioPayError('boom', 500).errorCode).toBeUndefined();
  });
});
