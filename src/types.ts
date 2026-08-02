/**
 * ElgioPay SDK Types
 */

export type Currency = 'XAF' | 'XOF' | 'EUR' | 'USD';
export type PaymentMethod = 'mtn_mobile_money' | 'orange_money';
export type Environment = 'sandbox' | 'prod';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/** Wallet a payout is drawn from. DEFAULT is the primary balance;
 *  SURCHARGE is the fee-collection wallet. */
export type PayoutSource = 'DEFAULT' | 'SURCHARGE';
export type PayoutMethod = 'mtn_mobile_money' | 'orange_money' | 'bank_transfer';

export interface ElgioPayConfig {
  apiKey?: string;
  environment?: Environment;
  timeout?: number;
}

export interface PaymentData {
  amount: number;
  currency?: Currency;
  payment_method: PaymentMethod;
  customer_phone: string;
  customer_name?: string;
  customer_email?: string;
  reference?: string;
  metadata?: Record<string, any>;
  /** Optional add-on flowing to the SURCHARGE wallet when it exceeds
   *  the platform's own fee. See the billing profile for details. */
  surcharge?: number;
}

export interface PaymentResponse {
  success: boolean;
  transaction_id: string;
  status: PaymentStatus;
  payment_url?: string;
  message: string;
}

export interface PaymentStatusResponse {
  transaction_id: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  payment_method: PaymentMethod;
  created_at: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerification {
  success: boolean;
  transaction_id: string;
  status: PaymentStatus;
  verified: boolean;
  message: string;
}

// ─── Balance ─────────────────────────────────────────────────────────

export interface BalanceEntry {
  currency: Currency | string;
  /** Wallet type — DEFAULT (payouts) or SURCHARGE (fee collections). */
  type: PayoutSource;
  balance: number;
  reserved_balance: number;
  available_balance: number;
}

export interface BalanceResponse {
  data: BalanceEntry[];
}

// ─── Payouts ─────────────────────────────────────────────────────────

export interface PayoutData {
  amount: number;
  currency?: Currency;
  /** Which wallet to debit — defaults to DEFAULT server-side. */
  source?: PayoutSource;
  payout_method: PayoutMethod;
  /** Required for mtn_mobile_money / orange_money. */
  recipient_phone?: string;
  recipient_name: string;
  recipient_email?: string;
  /** Required for bank_transfer. */
  bank_account_number?: string;
  bank_name?: string;
  bank_code?: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface Payout {
  payout_id: string;
  status: PaymentStatus;
  amount: number;
  /** Platform fee — debited on top of `amount`. Recipient still gets the
   *  full amount; the merchant is charged `amount + fees`. */
  fees: number;
  currency: Currency | string;
  source: PayoutSource;
  payout_method: PayoutMethod;
  recipient_phone?: string;
  recipient_name?: string;
  recipient_email?: string;
  reference?: string;
  description?: string;
  created_at: string;
  completed_at?: string;
  failed_at?: string;
  failure_reason?: string;
}

export interface PayoutResponse {
  success: boolean;
  payout: Payout;
  message?: string;
}

export interface ValidateRecipientResponse {
  success: boolean;
  recipient_name?: string;
  message?: string;
}

// ─── Bills ───────────────────────────────────────────────────────────

export interface BillService {
  service_code: string;
  name: string;
  category?: string;
}

export interface CheckBillData {
  service_code: string;
  account_number: string;
}

export interface PayBillData {
  service_code: string;
  account_number: string;
  amount: number;
  customer_phone: string;
  /** Some billers expose multiple line items (e.g. subscription tiers).
   *  Omit unless the service_code documents an item_id requirement. */
  item_id?: string;
}

// ─── Cards (card payment intents) ────────────────────────────────────

/** Response from `POST /card-payment/init`. */
export interface CardInitResponse {
  /** Publishable key for the client-side card-collection widget. Safe
   *  to expose — it can only tokenise cards, not charge them. */
  app_id: string;
}

export interface CardProcessData {
  amount: number;
  currency: Currency | string;
  customer_name: string;
  /** Tokenised card id returned by the client-side card-collection
   *  widget. Optional — omit to get back a client_secret and finish
   *  the charge in the browser. */
  payment_method_id?: string;
  customer_email?: string;
  reference?: string;
  description?: string;
}

export interface CardProcessResponse {
  success: boolean;
  message: string;
  /** Present when the charge cleared without needing 3DS. */
  data?: Record<string, any>;
  /** `true` when 3D Secure needs to run client-side. */
  requires_action?: boolean;
  /** Client-side confirmation token. Hand to the client-side
   *  card-reveal library to complete 3D Secure when `requires_action`
   *  is true. */
  payment_intent_client_secret?: string;
  payment_intent_id?: string;
  transaction_id?: string;
}

export interface CardConfirmData {
  transaction_id: string;
  payment_intent_id: string;
}

// ─── SMS ─────────────────────────────────────────────────────────────

export type SmsChannel = 'sms' | 'whatsapp';

export interface SmsResponse {
  success: boolean;
  message_id?: string;
  message?: string;
}

// ─── Card issuing ────────────────────────────────────────────────────
//
// Types below mirror the Laravel API resources on the server side
// (App\Http\Resources\Issuing*Resource) and the phpstan shapes in
// sdk-php/src/Resources/Issuing/IssuingShapes.php. Keep the three in
// lockstep when the API shape changes.
//
// `processor` and `external_id` are intentionally NOT exposed —
// merchants shouldn't couple to whichever underlying provider
// (SwyChr / Stripe / …) elgiopay routes through. `id` and `uuid` are
// the merchant-facing identifiers.

export type IssuingCardStatus =
  | 'active'
  | 'inactive'
  | 'canceled'
  | 'pending'
  | 'frozen'
  | 'terminated'
  | 'unknown';

export type IssuingCardholderStatus = 'active' | 'inactive' | 'blocked';

export type IssuingTransactionType =
  | 'capture'
  | 'refund'
  | 'refund_reversal'
  | 'cash_withdrawal'
  | 'topup'
  | 'card_issuance'
  | 'dispute'
  | 'dispute_loss';

export type IssuingAuthorizationStatus = 'pending' | 'closed' | 'reversed';

// ─── Inputs ──────────────────────────────────────────────────────────

export interface IssuingBillingAddressInput {
  billing_address_line1: string;
  billing_address_line2?: string;
  billing_address_city: string;
  billing_address_state?: string;
  billing_address_postal_code: string;
  billing_address_country?: string;
}

export interface IssuingIndividualDob {
  day: number;
  month: number;
  year: number;
}

export interface IssuingSpendingLimit {
  amount: number;
  interval:
    | 'per_authorization'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'all_time';
  categories?: string[];
}

export interface IssuingSpendingControlsInput {
  allowed_categories?: string[];
  blocked_categories?: string[];
  spending_limits?: IssuingSpendingLimit[];
  daily_limit?: number;
  transaction_limit?: number;
}

export interface IssuingCardholderInput extends IssuingBillingAddressInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  type?: 'individual' | 'company';
  merchant_user_id?: string;
  individual_dob?: IssuingIndividualDob;
  spending_controls?: IssuingSpendingControlsInput;
}

export interface IssuingCardholderUpdateInput {
  email?: string;
  phone_number?: string;
  status?: 'active' | 'inactive';
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_address_city?: string;
  billing_address_state?: string;
  billing_address_postal_code?: string;
  billing_address_country?: string;
  spending_controls?: IssuingSpendingControlsInput;
}

export interface IssuingCardInput {
  cardholder_id: number | string;
  product?: 'lite' | 'prepaid_credit' | 'prepaid_debit' | 'contactless';
  card_type?: 'VISA' | 'MASTERCARD';
  amount?: number;
  currency?: string;
  status?: 'active' | 'inactive';
  type?: 'virtual' | 'physical';
  daily_limit?: number;
  transaction_limit?: number;
  spending_controls?: IssuingSpendingControlsInput;
}

// ─── Responses ───────────────────────────────────────────────────────

export interface IssuingBillingAddress {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
}

export interface IssuingMerchantData {
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  category: string | null;
  category_code: string | null;
  network_id: string | null;
}

export interface IssuingCardholder {
  id: number;
  uuid: string;
  merchant_user_id: string | null;
  type: 'individual' | 'company';
  name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  status: IssuingCardholderStatus;
  billing_address: IssuingBillingAddress;
  spending_controls: Record<string, any> | null;
  cards_count?: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface IssuingCard {
  id: number;
  uuid: string;
  type: 'virtual' | 'physical';
  brand: string | null;
  last4: string | null;
  masked_number: string;
  exp_month: number | null;
  exp_year: number | null;
  expiry_date: string;
  currency: string | null;
  /** Card balance in major units (e.g. 12.50 = $12.50). */
  balance: number;
  balance_currency: string | null;
  formatted_balance: string;
  status: IssuingCardStatus;
  cancellation_reason: string | null;
  spending_controls: Record<string, any> | null;
  pin_blocked: boolean;
  wallets: Record<string, any> | null;
  cardholder_id: number;
  cardholder?: IssuingCardholder;
  metadata: Record<string, any> | null;
  created_at: string;
  activated_at: string | null;
  canceled_at: string | null;
}

export interface IssuingCardBalance {
  card_id: number;
  uuid: string;
  balance: number;
  balance_currency: string | null;
  formatted_balance: string;
}

export interface IssuingCardSensitiveDetails {
  id: number;
  number: string | null;
  cvc: string | null;
  exp_month: number | null;
  exp_year: number | null;
}

export interface IssuingAuthorization {
  id: number;
  uuid: string;
  amount: number;
  formatted_amount: string;
  merchant_amount: number | null;
  currency: string;
  merchant_currency: string | null;
  status: IssuingAuthorizationStatus;
  approved: boolean;
  authorization_method: string | null;
  merchant_data: IssuingMerchantData;
  merchant_display_name: string;
  merchant_location: string;
  verification_data: Record<string, any> | null;
  wallet: string | null;
  card_id: number;
  cardholder_id: number;
  card?: IssuingCard;
  metadata: Record<string, any> | null;
  authorized_at: string | null;
  created_at: string;
}

export interface IssuingTransaction {
  id: number;
  uuid: string;
  type: IssuingTransactionType;
  /** Absolute amount in major units. Use `amount_sign` for direction. */
  amount: number;
  /** Sign prefix: `+` for credits (topup/refund), `-` for debits. */
  amount_sign: '+' | '-';
  formatted_amount: string;
  merchant_amount: number | null;
  currency: string;
  merchant_currency: string | null;
  description: string | null;
  /** Provider status label — e.g. Approved / Declined / Pending. */
  status: string | null;
  balance_after_transaction: number | null;
  merchant_data: IssuingMerchantData;
  merchant_display_name: string;
  merchant_location: string;
  purchase_details: Record<string, any> | null;
  wallet: string | null;
  dispute_id: string | null;
  card_id: number;
  cardholder_id: number;
  authorization_id: number | null;
  card?: IssuingCard;
  authorization?: IssuingAuthorization;
  metadata: Record<string, any> | null;
  /** Wallclock time the transaction happened at the provider. May be
   *  earlier than `created_at` when the row was backfilled via sync. */
  transacted_at: string | null;
  created_at: string;
}

export interface IssuingCardStatistics {
  balance: number;
  balance_currency: string | null;
  transactions_count: number;
  authorizations_count: number;
  declined_count: number;
  month_spend: number;
}

export interface IssuingEphemeralKey {
  id: string;
  object: string;
  associated_objects: { type: string; id: string }[];
  created: number;
  expires: number;
  livemode: boolean;
  secret: string;
}

export interface IssuingListResponse<T> {
  success: boolean;
  data: T[];
  meta: { total: number };
}

export interface IssuingItemResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Webhooks ────────────────────────────────────────────────────────
//
// elgiopay signs every outbound webhook with an HMAC-SHA256. Verify
// deliveries with `verifyWebhook()` before parsing. See docs/WEBHOOKS.md
// or the sdk-node/src/webhooks/signature.ts source for the wire format.

export type WebhookEvent =
  // Payments
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.pending'
  // Payouts
  | 'payout.completed'
  | 'payout.failed'
  // Refunds
  | 'refund.completed'
  | 'refund.failed'
  // Card issuing — one contract regardless of provider.
  | 'issuing_card.created'
  | 'issuing_card.updated'
  | 'issuing_card.terminated'
  | 'issuing_card.expiration'
  | 'issuing_authorization.created'
  | 'issuing_transaction.created';

export interface WebhookEnvelope<T = Record<string, any>> {
  id: string;
  event: WebhookEvent | string;
  /** Unix timestamp (seconds) the envelope was built. */
  created: number;
  data: T;
}

// ─── Errors ──────────────────────────────────────────────────────────

export class ElgioPayError extends Error {
  public code: number;
  public response?: any;

  constructor(message: string, code: number = 500, response?: any) {
    super(message);
    this.name = 'ElgioPayError';
    this.code = code;
    this.response = response;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, ElgioPayError);
    }
  }
}

export interface CameroonPaymentOptions {
  customer_name?: string;
  customer_email?: string;
  reference?: string;
  metadata?: Record<string, any>;
}
