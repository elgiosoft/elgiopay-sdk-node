import { WebhookEvent } from '../types';

/**
 * Canonical list of webhook event names elgiopay emits.
 *
 * Route incoming envelopes with:
 *
 *   switch (envelope.event) {
 *     case WebhookEvents.ISSUING_CARD_CREATED:
 *       return onCardCreated(envelope.data as IssuingCard);
 *     case WebhookEvents.ISSUING_TRANSACTION_CREATED:
 *       return onTransaction(envelope.data as IssuingTransaction);
 *     // …
 *   }
 *
 * Merchants opt into events on a per-app basis in the dashboard. An
 * empty subscription list = all events. Set a subset to reduce noise.
 */
export const WebhookEvents = {
  // Payments
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_PENDING: 'payment.pending',

  // Payouts
  PAYOUT_COMPLETED: 'payout.completed',
  PAYOUT_FAILED: 'payout.failed',

  // Refunds
  REFUND_COMPLETED: 'refund.completed',
  REFUND_FAILED: 'refund.failed',

  // Card issuing — one contract regardless of provider.
  ISSUING_CARD_CREATED: 'issuing_card.created',
  ISSUING_CARD_UPDATED: 'issuing_card.updated',
  ISSUING_CARD_TERMINATED: 'issuing_card.terminated',
  ISSUING_CARD_EXPIRATION: 'issuing_card.expiration',
  ISSUING_AUTHORIZATION_CREATED: 'issuing_authorization.created',
  ISSUING_TRANSACTION_CREATED: 'issuing_transaction.created',

  // Connected merchants — always delivered to the PLATFORM's webhook URL,
  // never the sub-merchant's. `data.merchant_id` names the sub-merchant.
  CONNECTED_MERCHANT_CREATED: 'connected_merchant.created',
  CONNECTED_MERCHANT_KYC_SUBMITTED: 'connected_merchant.kyc.submitted',
  CONNECTED_MERCHANT_KYC_APPROVED: 'connected_merchant.kyc.approved',
  CONNECTED_MERCHANT_KYC_REJECTED: 'connected_merchant.kyc.rejected',
  CONNECTED_MERCHANT_PAYOUT_PAID: 'connected_merchant.payout.paid',
  CONNECTED_MERCHANT_PAYOUT_FAILED: 'connected_merchant.payout.failed',
  CONNECTED_MERCHANT_DEACTIVATED: 'connected_merchant.deactivated',
  CONNECTED_MERCHANT_REACTIVATED: 'connected_merchant.reactivated',
} as const satisfies Record<string, WebhookEvent>;

/** All webhook event names as a runtime array (useful for UI pickers). */
export const ALL_WEBHOOK_EVENTS: WebhookEvent[] = Object.values(WebhookEvents);
