import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ElgioPayConfig,
  PaymentData,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentVerification,
  ElgioPayError,
  Currency,
  Environment,
  BalanceResponse,
  PayoutData,
  PayoutResponse,
  ValidateRecipientResponse,
  BillService,
  CheckBillData,
  PayBillData,
  SmsChannel,
  SmsResponse,
} from './types';
import {
  isValidCameroonPhone,
  isValidEmail,
  generateReference,
  validateAmount,
  sleep,
  calculateBackoff,
} from './utils';
import { CardClient } from './resources/card';
import { IssuingClient } from './resources/issuing';

/**
 * Main entry point to the ElgioPay API. Handles mobile-money payments,
 * payouts, balance queries, bill payments, SMS, plus a sub-client for
 * card payments (`client.cards`).
 */
export class ElgioPayClient {
  private client: AxiosInstance;
  private apiKey: string;
  private environment: Environment;

  /** Card-payment sub-client. Lazily instantiated on first access so
   *  apps that never touch cards don't pay the setup cost. */
  private _cards: CardClient | null = null;

  /** Card-issuing sub-client. Lazily instantiated. */
  private _issuing: IssuingClient | null = null;

  constructor(config: ElgioPayConfig = {}) {
    // Get from environment variables if not provided
    this.apiKey = config.apiKey || process.env.ELGIOPAY_API_KEY || '';
    this.environment = config.environment || (process.env.ELGIOPAY_ENV as Environment) || 'prod';

    // Validate API key
    if (!this.apiKey) {
      throw new ElgioPayError('ELGIOPAY_API_KEY is required. Set it as environment variable or pass it in config.', 400);
    }

    this.client = axios.create({
      baseURL: this.getBaseUrl(this.environment),
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ElgioPay-Node-SDK/1.0.0',
      },
    });

    // Normalise every non-2xx response to an ElgioPayError so callers only
    // ever have to handle one exception type.
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: any) => {
        if (error.response) {
          throw new ElgioPayError(
            error.response.data?.message || 'API request failed',
            error.response.status,
            error.response.data,
          );
        } else if (error.request) {
          throw new ElgioPayError('Network error - no response received', 0);
        } else {
          throw new ElgioPayError(`Request setup error: ${error.message}`, 0);
        }
      },
    );
  }

  // ─── Payments ──────────────────────────────────────────────────────

  /**
   * Initiate a mobile money payment.
   *
   * The customer receives an on-phone prompt (USSD or app notification)
   * to authorize the charge. The returned transaction sits in `pending`
   * until confirmed — poll `getPaymentStatus()` or listen on the
   * `payment.completed` / `payment.failed` webhooks.
   */
  async initiatePayment(paymentData: PaymentData): Promise<PaymentResponse> {
    this.validatePaymentData(paymentData);

    const response: AxiosResponse<PaymentResponse> = await this.client.post('/api/v1/payments', paymentData);
    return response.data;
  }

  /**
   * Fetch the current status of a transaction. Safe to poll — this is a
   * read-only call and does not trigger provider re-verification. Use
   * `verifyPayment()` when you want to actively re-check with the
   * payment provider.
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const response: AxiosResponse<PaymentStatusResponse> = await this.client.get(`/api/v1/payments/${transactionId}`);
    return response.data;
  }

  /**
   * Force a fresh status check against the payment provider. Use this
   * when `getPaymentStatus()` looks stuck or you're wrapping up an order
   * and want to confirm before committing to fulfilment.
   */
  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    const response: AxiosResponse<PaymentVerification> = await this.client.post(`/api/v1/payments/${transactionId}/verify`);
    return response.data;
  }

  /**
   * Wrap `initiatePayment()` with exponential backoff. The delay doubles
   * between attempts (~1s, 2s, 4s…). Bails out early on 4xx client
   * errors — retrying a validation failure never helps.
   */
  async createPaymentWithRetry(
    paymentData: PaymentData,
    maxRetries: number = 3,
  ): Promise<PaymentResponse> {
    let lastError: ElgioPayError | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.initiatePayment(paymentData);
      } catch (error) {
        lastError = error as ElgioPayError;

        // Don't retry on validation errors (4xx)
        if (lastError.code >= 400 && lastError.code < 500) {
          throw lastError;
        }

        if (attempt < maxRetries - 1) {
          const delay = calculateBackoff(attempt);
          await sleep(delay);
        }
      }
    }

    throw lastError;
  }

  // ─── Balance & Payouts ─────────────────────────────────────────────

  /**
   * Fetch the app's current balance(s). Returns entries for every
   * currency + wallet type the app holds — DEFAULT (payouts) and
   * SURCHARGE (fee collections) if either is non-zero.
   */
  async getBalance(): Promise<BalanceResponse> {
    const response = await this.client.get<BalanceResponse>('/api/v1/balance');
    return response.data;
  }

  /**
   * List payouts for the app, newest first. Server pages the response
   * — check the pagination envelope for `next_page_url` if you need
   * more than the first page.
   */
  async getPayouts<T = unknown>(): Promise<T> {
    const response = await this.client.get<T>('/api/v1/payouts');
    return response.data;
  }

  /**
   * Send funds to a recipient. The app is debited `amount + fees` —
   * `amount` reaches the recipient in full, `fees` is the platform cut
   * (see the billing profile associated with your app).
   *
   * `source` picks which wallet to draw from:
   *   - `DEFAULT` (default) — your primary balance
   *   - `SURCHARGE` — the fee-collection wallet
   */
  async createPayout(payoutData: PayoutData): Promise<PayoutResponse> {
    const response = await this.client.post<PayoutResponse>('/api/v1/payouts', payoutData);
    return response.data;
  }

  /**
   * Fetch the current status of a payout. Same lifecycle as payments —
   * `pending` → `processing` → `completed` / `failed` / `cancelled`.
   */
  async getPayoutStatus<T = unknown>(payoutId: string): Promise<T> {
    const response = await this.client.get<T>(`/api/v1/payouts/${payoutId}`);
    return response.data;
  }

  /**
   * Look up recipient details before initiating a payout — confirms the
   * number is reachable on a supported network and returns the account
   * holder name so you can double-check the destination.
   */
  async validateRecipient(phoneNumber: string): Promise<ValidateRecipientResponse> {
    const response = await this.client.post<ValidateRecipientResponse>(
      '/api/v1/validate-recipient',
      { recipient: phoneNumber },
    );
    return response.data;
  }

  // ─── Bills ─────────────────────────────────────────────────────────

  /**
   * List every biller service this app can pay against — electricity,
   * water, TV subscriptions, etc. The response includes the
   * `service_code` values you'll pass to `checkBill()` and `payBill()`.
   */
  async getBilling(): Promise<BillService[]> {
    const response = await this.client.get<BillService[]>('/api/v1/bills');
    return response.data;
  }

  /**
   * Fetch the amount due on a customer's bill without paying it. Use
   * this to display the amount + biller-side account details for
   * confirmation before calling `payBill()`.
   */
  async checkBilling<T = unknown>(billData: CheckBillData): Promise<T> {
    const response = await this.client.post<T>('/api/v1/bills/get-bill', billData);
    return response.data;
  }

  /**
   * Pay a customer bill. `item_id` is only required for services that
   * expose multiple line items (e.g. subscription tiers) — omit it
   * otherwise.
   */
  async payBilling<T = unknown>(billData: PayBillData): Promise<T> {
    const response = await this.client.post<T>('/api/v1/bills/pay', billData);
    return response.data;
  }

  // ─── Services ──────────────────────────────────────────────────────

  /**
   * Send a transactional SMS. Requires the SMS service to be enabled on
   * your app — see the Services section of the dashboard.
   */
  async sendSMS(
    phoneNumber: string,
    message: string,
    channels: SmsChannel[] = ['sms'],
  ): Promise<SmsResponse> {
    const response = await this.client.post<SmsResponse>('/api/v1/services/sms/send', {
      to: phoneNumber,
      message,
      channels,
    });
    return response.data;
  }

  // ─── Card payments ─────────────────────────────────────────────────

  /**
   * Card-payment sub-client — card processing (init, process,
   * confirm-after-3DS). Lazily instantiated so apps that never touch
   * cards don't pay the setup cost.
   */
  get cards(): CardClient {
    if (this._cards === null) {
      this._cards = new CardClient(this.client);
    }
    return this._cards;
  }

  /**
   * Card-issuing sub-client — issue prepaid virtual/physical cards to
   * your customers, top them up, stream authorizations and
   * transactions. Lazily instantiated so apps that never touch issuing
   * don't pay the setup cost.
   */
  get issuing(): IssuingClient {
    if (this._issuing === null) {
      this._issuing = new IssuingClient(this.client);
    }
    return this._issuing;
  }

  // ─── Internals ─────────────────────────────────────────────────────

  /**
   * Client-side sanity check on the payment payload before the request
   * leaves the SDK. Server-side validation is still authoritative — this
   * just fails fast so obviously-broken calls don't hit the network.
   */
  private validatePaymentData(paymentData: PaymentData): void {
    if (!validateAmount(paymentData.amount, paymentData.currency)) {
      throw new ElgioPayError('Invalid amount. Minimum 100 XAF required.', 400);
    }

    if (!isValidCameroonPhone(paymentData.customer_phone)) {
      throw new ElgioPayError('Invalid phone number format. Use +237XXXXXXXX format.', 400);
    }

    if (paymentData.customer_email && !isValidEmail(paymentData.customer_email)) {
      throw new ElgioPayError('Invalid email format.', 400);
    }

    if (!paymentData.reference) {
      paymentData.reference = generateReference();
    }
  }

  /**
   * Replace the axios timeout in place (milliseconds). Chainable.
   */
  setTimeout(timeout: number): ElgioPayClient {
    this.client.defaults.timeout = timeout;
    return this;
  }

  /**
   * Rotate the API key on an existing client. Chainable.
   */
  setApiKey(apiKey: string): ElgioPayClient {
    this.apiKey = apiKey;
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
    return this;
  }

  private getBaseUrl(environment: Environment): string {
    switch (environment) {
      case 'sandbox':
        return process.env.ELGIOPAY_SANDBOX_URL || 'https://sandbox-api.elgiopay.com';
      case 'prod':
      default:
        return 'https://api.elgiopay.com';
    }
  }
}
