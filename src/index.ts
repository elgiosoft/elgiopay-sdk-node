/**
 * ElgioPay SDK for Node.js
 *
 * @author Elgiosoft Ltd
 * @version 1.0.0
 */

export { ElgioPayClient } from './client';
export { CardClient } from './resources/card';
export { IssuingClient } from './resources/issuing';
export { ConnectedMerchantsClient } from './resources/connectedMerchants';
export { verifyWebhook, DEFAULT_TOLERANCE_SECONDS } from './webhooks/signature';
export type { VerifyOptions } from './webhooks/signature';
export { WebhookEvents, ALL_WEBHOOK_EVENTS } from './webhooks/events';
export { detectChannel, detectCountry } from './detectChannel';
export {
  ElgioPayConfig,
  PaymentData,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentVerification,
  ElgioPayError,
  Currency,
  PaymentMethod,
  Environment,
  PaymentStatus,
  // Balance & payouts
  PayoutSource,
  PayoutMethod,
  BalanceEntry,
  BalanceResponse,
  PayoutData,
  Payout,
  PayoutResponse,
  ValidateRecipientResponse,
  // Bills
  BillService,
  CheckBillData,
  PayBillData,
  // Channels
  Channel,
  ChannelFilters,
  // Cards
  CardInitResponse,
  CardProcessData,
  CardProcessResponse,
  CardConfirmData,
  // Card issuing
  IssuingCardStatus,
  IssuingCardholderStatus,
  IssuingTransactionType,
  IssuingAuthorizationStatus,
  IssuingBillingAddressInput,
  IssuingIndividualDob,
  IssuingSpendingLimit,
  IssuingSpendingControlsInput,
  IssuingCardholderInput,
  IssuingCardholderUpdateInput,
  IssuingCardInput,
  IssuingBillingAddress,
  IssuingMerchantData,
  IssuingCardholder,
  IssuingCard,
  IssuingCardBalance,
  IssuingCardSensitiveDetails,
  IssuingAuthorization,
  IssuingTransaction,
  IssuingCardStatistics,
  IssuingEphemeralKey,
  IssuingListResponse,
  IssuingItemResponse,
  // Connected merchants (platform apps)
  ConnectedMerchantKycStatus,
  ConnectedMerchantCapabilities,
  ConnectedMerchant,
  ConnectedMerchantInput,
  ConnectedMerchantCreateResponse,
  ConnectedMerchantOnboardingState,
  ConnectedMerchantOnboardingLink,
  ConnectedMerchantListResponse,
  ConnectedMerchantBalance,
  ConnectedMerchantPayoutInput,
  ConnectedMerchantPayoutResponse,
  ConnectedMerchantStatusResponse,
  ConnectedMerchantErrorCode,
  // Webhooks
  WebhookEvent,
  WebhookEnvelope,
  // SMS
  SmsChannel,
  SmsResponse,
} from './types';
export {
  normalizeCameroonPhone,
  isValidCameroonPhone,
  isValidEmail,
  generateReference,
  validateAmount,
  formatAmount,
  sleep,
  calculateBackoff,
} from './utils';

// Default export
import { ElgioPayClient } from './client';
export default ElgioPayClient;
