import { AxiosInstance } from 'axios';
import {
  ConnectedMerchant,
  ConnectedMerchantBalance,
  ConnectedMerchantCreateResponse,
  ConnectedMerchantInput,
  ConnectedMerchantListResponse,
  ConnectedMerchantOnboardingLink,
  ConnectedMerchantPayoutInput,
  ConnectedMerchantPayoutResponse,
  ConnectedMerchantStatusResponse,
} from '../types';

/**
 * Connected-merchant sub-client. Accessed via `client.connectedMerchants`.
 *
 * For **platform** apps: onboard sub-merchants, charge on their behalf, read
 * their balances and pay them out. Every method here needs both the merchant
 * to be a platform AND the calling app to be flagged as a platform app —
 * otherwise the API answers 403 `NOT_A_PLATFORM`.
 *
 * A connected merchant lives inside exactly one app — the app whose key
 * created it — so none of these calls take an app parameter, and a merchant
 * created with app A's key is invisible to app B's key
 * (`NOT_YOUR_MERCHANT` / `SUB_MERCHANT_NOT_YOURS`).
 *
 * Typical flow:
 *   1. `create({ email, company_name })` — returns a `merchant_id` and an
 *      `onboarding_url`. The merchant starts at `kyc_status: 'pending'`.
 *   2. Send the sub-merchant to that `onboarding_url` to complete its own KYC.
 *      You deliver the link yourself (email, in-app, however you already reach
 *      them) — elgiopay does not contact your merchants on your behalf. Watch
 *      for `connected_merchant.kyc.submitted` / `.approved` / `.rejected`.
 *   3. Charge on its behalf: `client.initiatePayment({ …, sub_merchant_id })`.
 *      The net amount credits the sub-merchant's own balance.
 *   4. `getBalance(id)` then `createPayout(id, { … })` to settle.
 *   5. Handle `connected_merchant.*` webhooks — they are delivered to the
 *      *platform's* webhook URL, not the sub-merchant's.
 */
export class ConnectedMerchantsClient {
  constructor(private client: AxiosInstance) {}

  /**
   * Onboard a sub-merchant inside the calling app.
   *
   * Provide `email` plus at least one of `company_name` / `first_name`.
   * Throttled to 60 requests/minute. The response shape is identical
   * whether or not the email already existed, so don't use it to detect
   * duplicates.
   */
  async create(data: ConnectedMerchantInput): Promise<ConnectedMerchantCreateResponse> {
    const response = await this.client.post<ConnectedMerchantCreateResponse>(
      '/api/v1/connected-merchants',
      data,
    );
    return response.data;
  }

  /**
   * Mint a fresh hosted-KYC link for a sub-merchant.
   *
   * `create()` already returns one, so this is for the cases where that link is
   * gone: never opened before it expired (24h), opened on the wrong device (it
   * is single-use), or the merchant was rejected and needs another go.
   *
   * Issuing invalidates any previous link, which makes this the way to revoke
   * one as well. Throws with `errorCode`:
   *   - `MERCHANT_INACTIVE` (409) — reactivate it first.
   *   - `KYC_ALREADY_APPROVED` (409) — nothing left to submit.
   *   - `NOT_YOUR_MERCHANT` (403) — not yours, or not in this app.
   */
  async createOnboardingLink(merchantId: string): Promise<ConnectedMerchantOnboardingLink> {
    const response = await this.client.post<ConnectedMerchantOnboardingLink>(
      `/api/v1/connected-merchants/${merchantId}/onboarding-link`,
    );
    return response.data;
  }

  /** Page through the platform's connected merchants. */
  async list(query: { per_page?: number; page?: number } = {}): Promise<ConnectedMerchantListResponse> {
    const response = await this.client.get<ConnectedMerchantListResponse>(
      '/api/v1/connected-merchants',
      { params: query },
    );
    return response.data;
  }

  /** Fetch one connected merchant by its `merchant_id`. */
  async get(merchantId: string): Promise<ConnectedMerchant> {
    const response = await this.client.get<ConnectedMerchant>(
      `/api/v1/connected-merchants/${merchantId}`,
    );
    return response.data;
  }

  /**
   * The sub-merchant's own balance — funds routed to it by charges carrying
   * its `sub_merchant_id`. Separate from your app float.
   */
  async getBalance(merchantId: string, currency = 'XAF'): Promise<ConnectedMerchantBalance> {
    const response = await this.client.get<ConnectedMerchantBalance>(
      `/api/v1/connected-merchants/${merchantId}/balance`,
      { params: { currency } },
    );
    return response.data;
  }

  /**
   * Pay the sub-merchant out to its own destination, drawn from its own
   * balance (not your app float). Rejected with `MERCHANT_INACTIVE` (409)
   * if the merchant is deactivated.
   */
  async createPayout(
    merchantId: string,
    data: ConnectedMerchantPayoutInput,
  ): Promise<ConnectedMerchantPayoutResponse> {
    const response = await this.client.post<ConnectedMerchantPayoutResponse>(
      `/api/v1/connected-merchants/${merchantId}/payouts`,
      data,
    );
    return response.data;
  }

  /**
   * Freeze the sub-merchant: new charges are refused with
   * `SUB_MERCHANT_INACTIVE` and payouts with `MERCHANT_INACTIVE`. Its
   * existing balance is untouched. Reversible via `reactivate()`.
   */
  async deactivate(merchantId: string): Promise<ConnectedMerchantStatusResponse> {
    const response = await this.client.post<ConnectedMerchantStatusResponse>(
      `/api/v1/connected-merchants/${merchantId}/deactivate`,
    );
    return response.data;
  }

  /** Unfreeze a previously deactivated sub-merchant. */
  async reactivate(merchantId: string): Promise<ConnectedMerchantStatusResponse> {
    const response = await this.client.post<ConnectedMerchantStatusResponse>(
      `/api/v1/connected-merchants/${merchantId}/reactivate`,
    );
    return response.data;
  }
}
