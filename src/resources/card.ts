import { AxiosInstance } from 'axios';
import {
  CardInitResponse,
  CardProcessData,
  CardProcessResponse,
  CardConfirmData,
} from '../types';

/**
 * Card-payment sub-client. Accessed via `client.cards`.
 *
 * Typical flow:
 *   1. `initialize()` to fetch the publishable key for the client-side
 *      card-collection widget.
 *   2. Collect the card client-side and get back a `payment_method_id`.
 *   3. `processPayment()` with that id.
 *   4. If the response has `requires_action: true`, complete the 3D
 *      Secure challenge client-side and then call `confirmPayment()`
 *      to reconcile.
 */
export class CardClient {
  constructor(private client: AxiosInstance) {}

  /**
   * Fetch the publishable key used to initialise the client-side card
   * widget in your frontend.
   */
  async initialize(): Promise<CardInitResponse> {
    const response = await this.client.post<CardInitResponse>('/api/v1/card-payment/init');
    return response.data;
  }

  /**
   * Attempt a server-side charge. `payment_method_id` is the tokenised
   * card your frontend produced with the card-collection widget.
   *
   * Response scenarios:
   *   - `success: true` — charge cleared, transaction is completed.
   *   - `success: true` + `requires_action: true` — 3D Secure needed;
   *     hand `payment_intent_client_secret` back to the frontend and
   *     complete SCA there before calling `confirmPayment()`.
   *
   * Platform apps can set `sub_merchant_id` to route the charge to a connected
   * merchant. It's validated before the transaction is created, so a bad id is
   * a clean 422 (`SUB_MERCHANT_NOT_FOUND` / `_NOT_CONNECTED` / `_NOT_YOURS` /
   * `_INACTIVE`) with no charge attempted.
   */
  async processPayment(paymentData: CardProcessData): Promise<CardProcessResponse> {
    const response = await this.client.post<CardProcessResponse>(
      '/api/v1/card-payment/process',
      paymentData,
    );
    return response.data;
  }

  /**
   * Reconcile a transaction after the client finished the 3D Secure
   * flow. Fetches the latest state from the card processor and marks
   * the transaction completed or failed accordingly.
   */
  async confirmPayment(paymentData: CardConfirmData): Promise<CardProcessResponse> {
    const response = await this.client.post<CardProcessResponse>(
      '/api/v1/card-payment/confirm',
      paymentData,
    );
    return response.data;
  }
}
