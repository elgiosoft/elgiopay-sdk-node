import { createHmac, timingSafeEqual } from 'crypto';
import { ElgioPayError, WebhookEnvelope } from '../types';

/**
 * Verify the authenticity of an inbound elgiopay webhook.
 *
 * elgiopay signs every outbound delivery with an HMAC-SHA256 of the
 * raw request body plus a timestamp:
 *
 *   X-Elgiopay-Signature: t=<unix_ts>,v1=<hex>
 *   X-Elgiopay-Event:     <event.name>
 *   X-Elgiopay-Event-Id:  <event_id>
 *
 * where the hex is `hmac_sha256("<t>.<body>", <app.webhook_secret>)`.
 *
 * Express / Fastify usage:
 *
 *   app.post('/webhooks/elgiopay',
 *     express.raw({ type: 'application/json' }),
 *     (req, res) => {
 *       try {
 *         const envelope = verifyWebhook(
 *           req.body.toString('utf8'),           // raw, unparsed
 *           req.header('X-Elgiopay-Signature'),
 *           process.env.ELGIOPAY_WEBHOOK_SECRET!,
 *         );
 *         handle(envelope);
 *         res.sendStatus(200);
 *       } catch (e) {
 *         res.sendStatus(401);  // elgiopay will retry with backoff
 *       }
 *     },
 *   );
 *
 * Note: `req.body` MUST be the raw buffer, not the parsed JSON — any
 * whitespace / key-order change after JSON.parse breaks the HMAC.
 */

/** Default replay-window: 5 minutes. Match `WebhookSignature.php`. */
export const DEFAULT_TOLERANCE_SECONDS = 300;

export interface VerifyOptions {
  toleranceSeconds?: number;
}

export function verifyWebhook<T = Record<string, any>>(
  rawBody: string,
  signatureHeader: string | undefined | null,
  webhookSecret: string,
  options: VerifyOptions = {},
): WebhookEnvelope<T> {
  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;

  if (!signatureHeader) {
    throw new ElgioPayError('Missing X-Elgiopay-Signature header', 401);
  }

  const { timestamp, signature } = parseHeader(signatureHeader);

  // Freshness check first — cheap and eliminates a whole class of
  // replay attacks before we spend cycles on HMAC.
  const nowSeconds = Math.floor(Date.now() / 1000);
  const age = nowSeconds - timestamp;
  if (age > tolerance || age < -tolerance) {
    throw new ElgioPayError(
      `Webhook timestamp outside tolerance window (${tolerance}s)`,
      401,
    );
  }

  const computed = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');

  // timingSafeEqual only accepts equal-length buffers — bail early on
  // length mismatch so we don't leak that fact via a throw shape.
  const expected = Buffer.from(signature, 'hex');
  const actual = Buffer.from(computed, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ElgioPayError('Webhook signature mismatch', 401);
  }

  let envelope: unknown;
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    throw new ElgioPayError('Webhook body is not valid JSON', 400);
  }
  if (
    typeof envelope !== 'object' ||
    envelope === null ||
    !('event' in envelope) ||
    !('data' in envelope)
  ) {
    throw new ElgioPayError('Webhook body is not a valid envelope', 400);
  }

  return envelope as WebhookEnvelope<T>;
}

/**
 * Parse `t=<ts>,v1=<hex>` into { timestamp, signature }. Additional
 * scheme versions (v2, v3, …) would land here as new branches; unknown
 * schemes fall through so we don't silently accept them.
 */
function parseHeader(header: string): { timestamp: number; signature: string } {
  let timestamp: number | null = null;
  let signature: string | null = null;

  for (const raw of header.split(',')) {
    const part = raw.trim();
    if (part.startsWith('t=')) {
      timestamp = parseInt(part.slice(2), 10);
    } else if (part.startsWith('v1=')) {
      signature = part.slice(3);
    }
  }

  if (!timestamp || Number.isNaN(timestamp) || !signature) {
    throw new ElgioPayError('Malformed X-Elgiopay-Signature header', 401);
  }

  return { timestamp, signature };
}
