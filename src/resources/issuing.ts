import { AxiosInstance } from 'axios';
import {
  IssuingAuthorization,
  IssuingCard,
  IssuingCardBalance,
  IssuingCardInput,
  IssuingCardSensitiveDetails,
  IssuingCardStatistics,
  IssuingCardholder,
  IssuingCardholderInput,
  IssuingCardholderUpdateInput,
  IssuingEphemeralKey,
  IssuingItemResponse,
  IssuingListResponse,
  IssuingSpendingControlsInput,
  IssuingTransaction,
} from '../types';

/**
 * Card-issuing sub-client. Accessed via `client.issuing`.
 *
 * Issue prepaid virtual / physical cards to your customers, top them up
 * from your app balance, and stream card transactions back into your
 * ledger. The API is provider-agnostic: elgiopay routes to whichever
 * upstream processor the app is configured with — merchants shouldn't
 * couple to a specific provider.
 *
 * Typical flow:
 *   1. `createCardholder()` — capture KYC. Non-blocking; poll
 *      `getCardholder().status` until KYC is `approved`.
 *   2. `createCard({ cardholder_id, amount })` — issues a new card and
 *      funds it with `amount` (debited from your app balance + a
 *      per-card fee).
 *   3. `getCardDetails()` — fetch masked PAN + CVV for display in your
 *      UI (usually paired with the client-side card-reveal library).
 *   4. Handle `issuing_transaction.created` webhooks to keep your own
 *      ledger in sync.
 */
export class IssuingClient {
  constructor(private client: AxiosInstance) {}

  // ─── Cardholders ────────────────────────────────────────────────────

  async createCardholder(
    data: IssuingCardholderInput,
  ): Promise<IssuingItemResponse<IssuingCardholder>> {
    const response = await this.client.post<IssuingItemResponse<IssuingCardholder>>(
      '/api/v1/issuing/cardholders',
      data,
    );
    return response.data;
  }

  async listCardholders(
    query: Record<string, any> = {},
  ): Promise<IssuingListResponse<IssuingCardholder>> {
    const response = await this.client.get<IssuingListResponse<IssuingCardholder>>(
      '/api/v1/issuing/cardholders',
      { params: query },
    );
    return response.data;
  }

  async getCardholder(
    cardholderId: string | number,
  ): Promise<IssuingItemResponse<IssuingCardholder>> {
    const response = await this.client.get<IssuingItemResponse<IssuingCardholder>>(
      `/api/v1/issuing/cardholders/${cardholderId}`,
    );
    return response.data;
  }

  async updateCardholder(
    cardholderId: string | number,
    data: IssuingCardholderUpdateInput,
  ): Promise<IssuingItemResponse<IssuingCardholder>> {
    const response = await this.client.put<IssuingItemResponse<IssuingCardholder>>(
      `/api/v1/issuing/cardholders/${cardholderId}`,
      data,
    );
    return response.data;
  }

  // ─── Cards ──────────────────────────────────────────────────────────

  async createCard(data: IssuingCardInput): Promise<IssuingItemResponse<IssuingCard>> {
    const response = await this.client.post<IssuingItemResponse<IssuingCard>>(
      '/api/v1/issuing/cards',
      data,
    );
    return response.data;
  }

  async listCards(
    query: Record<string, any> = {},
  ): Promise<IssuingListResponse<IssuingCard>> {
    const response = await this.client.get<IssuingListResponse<IssuingCard>>(
      '/api/v1/issuing/cards',
      { params: query },
    );
    return response.data;
  }

  async getCard(cardId: string | number): Promise<IssuingItemResponse<IssuingCard>> {
    const response = await this.client.get<IssuingItemResponse<IssuingCard>>(
      `/api/v1/issuing/cards/${cardId}`,
    );
    return response.data;
  }

  /** Temporary lock — reversible via `unfreezeCard`. */
  async freezeCard(cardId: string | number): Promise<IssuingItemResponse<IssuingCard>> {
    const response = await this.client.post<IssuingItemResponse<IssuingCard>>(
      `/api/v1/issuing/cards/${cardId}/freeze`,
    );
    return response.data;
  }

  async unfreezeCard(cardId: string | number): Promise<IssuingItemResponse<IssuingCard>> {
    const response = await this.client.post<IssuingItemResponse<IssuingCard>>(
      `/api/v1/issuing/cards/${cardId}/unfreeze`,
    );
    return response.data;
  }

  /** Permanent — any remaining balance is refunded to your app balance. */
  async cancelCard(
    cardId: string | number,
    reason?: string,
  ): Promise<IssuingItemResponse<IssuingCard>> {
    const response = await this.client.post<IssuingItemResponse<IssuingCard>>(
      `/api/v1/issuing/cards/${cardId}/cancel`,
      reason ? { cancellation_reason: reason } : {},
    );
    return response.data;
  }

  async updateCardSpendingControls(
    cardId: string | number,
    spendingControls: IssuingSpendingControlsInput,
  ): Promise<IssuingItemResponse<IssuingCard>> {
    const response = await this.client.put<IssuingItemResponse<IssuingCard>>(
      `/api/v1/issuing/cards/${cardId}/spending-controls`,
      { spending_controls: spendingControls },
    );
    return response.data;
  }

  /**
   * Masked PAN + CVV, decrypted server-side. Pair with the client-side
   * card-reveal library for full-PAN display in your UI. Rate-limited —
   * don't call in a tight loop.
   */
  async getCardDetails(
    cardId: string | number,
  ): Promise<IssuingItemResponse<IssuingCardSensitiveDetails>> {
    const response = await this.client.get<IssuingItemResponse<IssuingCardSensitiveDetails>>(
      `/api/v1/issuing/cards/${cardId}/details`,
    );
    return response.data;
  }

  /**
   * Short-lived key for the client-side card-reveal library. Only
   * relevant for cards issued through processors that support it —
   * others (e.g. SwyChr) 400 with a clear error.
   */
  async createEphemeralKey(
    cardId: string | number,
    apiVersion?: string,
  ): Promise<IssuingItemResponse<IssuingEphemeralKey>> {
    const response = await this.client.post<IssuingItemResponse<IssuingEphemeralKey>>(
      `/api/v1/issuing/cards/${cardId}/ephemeral-key`,
      apiVersion ? { api_version: apiVersion } : {},
    );
    return response.data;
  }

  async getCardBalance(
    cardId: string | number,
  ): Promise<IssuingItemResponse<IssuingCardBalance>> {
    const response = await this.client.get<IssuingItemResponse<IssuingCardBalance>>(
      `/api/v1/issuing/cards/${cardId}/balance`,
    );
    return response.data;
  }

  /**
   * Move funds from your app balance onto the card. Amount is in major
   * units of the card's currency (e.g. 10 = $10 for a USD card).
   * Fees are debited on top of `amount`.
   */
  async topUpCard(
    cardId: string | number,
    amount: number,
    description?: string,
  ): Promise<IssuingItemResponse<IssuingCard>> {
    const response = await this.client.post<IssuingItemResponse<IssuingCard>>(
      `/api/v1/issuing/cards/${cardId}/topup`,
      { amount, description },
    );
    return response.data;
  }

  /**
   * Pull funds off the card back to your app balance. Amount is in major
   * units of the card's currency (e.g. 10 = $10 for a USD card). The card
   * is debited exactly `amount`; your app balance is credited
   * `amount - fee`.
   */
  async withdrawFromCard(
    cardId: string | number,
    amount: number,
    description?: string,
  ): Promise<IssuingItemResponse<IssuingCard>> {
    const response = await this.client.post<IssuingItemResponse<IssuingCard>>(
      `/api/v1/issuing/cards/${cardId}/withdraw`,
      { amount, description },
    );
    return response.data;
  }

  async listCardTransactions(
    cardId: string | number,
    query: Record<string, any> = {},
  ): Promise<IssuingListResponse<IssuingTransaction>> {
    const response = await this.client.get<IssuingListResponse<IssuingTransaction>>(
      `/api/v1/issuing/cards/${cardId}/transactions`,
      { params: query },
    );
    return response.data;
  }

  async listCardAuthorizations(
    cardId: string | number,
    query: Record<string, any> = {},
  ): Promise<IssuingListResponse<IssuingAuthorization>> {
    const response = await this.client.get<IssuingListResponse<IssuingAuthorization>>(
      `/api/v1/issuing/cards/${cardId}/authorizations`,
      { params: query },
    );
    return response.data;
  }

  async getCardStatistics(
    cardId: string | number,
  ): Promise<IssuingItemResponse<IssuingCardStatistics>> {
    const response = await this.client.get<IssuingItemResponse<IssuingCardStatistics>>(
      `/api/v1/issuing/cards/${cardId}/statistics`,
    );
    return response.data;
  }
}
