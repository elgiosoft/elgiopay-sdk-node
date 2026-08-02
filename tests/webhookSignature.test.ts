import { createHmac } from 'crypto';
import { verifyWebhook } from '../src/webhooks/signature';
import { ElgioPayError } from '../src/types';

/**
 * Security-sensitive: any regression here means merchants can be
 * tricked into processing forged webhook payloads. Cover the full
 * verification matrix (valid, tampered, replayed, mangled).
 */
describe('verifyWebhook', () => {
  const SECRET = 'whsec_test_super_secret_key';

  const sign = (body: string, ts: number, secret: string = SECRET): string =>
    `t=${ts},v1=${createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex')}`;

  it('accepts a valid signature', () => {
    const body = JSON.stringify({
      id: 'evt_1',
      event: 'issuing_card.created',
      created: Math.floor(Date.now() / 1000),
      data: { id: 1 },
    });
    const ts = Math.floor(Date.now() / 1000);

    const envelope = verifyWebhook(body, sign(body, ts), SECRET);
    expect(envelope.event).toBe('issuing_card.created');
    expect(envelope.data).toEqual({ id: 1 });
  });

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ id: 'evt_1', event: 'ok', created: 1, data: {} });
    const ts = Math.floor(Date.now() / 1000);
    const header = sign(body, ts);
    const tampered = JSON.stringify({ id: 'evt_1', event: 'ok', created: 1, data: { stolen: true } });

    expect(() => verifyWebhook(tampered, header, SECRET)).toThrow(/signature mismatch/);
  });

  it('rejects the wrong secret', () => {
    const body = JSON.stringify({ id: 'evt_1', event: 'ok', created: 1, data: {} });
    const ts = Math.floor(Date.now() / 1000);
    const header = sign(body, ts, 'not_the_real_secret');

    expect(() => verifyWebhook(body, header, SECRET)).toThrow(ElgioPayError);
  });

  it('rejects a stale timestamp', () => {
    const body = JSON.stringify({ id: 'evt_1', event: 'ok', created: 1, data: {} });
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;

    expect(() => verifyWebhook(body, sign(body, oneHourAgo), SECRET)).toThrow(
      /tolerance window/,
    );
  });

  it('rejects a missing header', () => {
    expect(() => verifyWebhook('{}', undefined, SECRET)).toThrow(/Missing/);
    expect(() => verifyWebhook('{}', null, SECRET)).toThrow(/Missing/);
  });

  it('rejects a malformed header', () => {
    expect(() => verifyWebhook('{}', 'not-a-signature', SECRET)).toThrow(/Malformed/);
  });

  it('rejects non-envelope body', () => {
    const body = JSON.stringify({ not: 'an envelope' });
    const ts = Math.floor(Date.now() / 1000);
    expect(() => verifyWebhook(body, sign(body, ts), SECRET)).toThrow(/envelope/);
  });

  it('respects a custom tolerance', () => {
    const body = JSON.stringify({ id: 'evt_1', event: 'ok', created: 1, data: {} });
    // 10 minutes ago — outside default (5m) but inside custom (15m).
    const tenMinAgo = Math.floor(Date.now() / 1000) - 600;
    const header = sign(body, tenMinAgo);

    expect(() => verifyWebhook(body, header, SECRET)).toThrow(/tolerance/);
    expect(() =>
      verifyWebhook(body, header, SECRET, { toleranceSeconds: 900 }),
    ).not.toThrow();
  });
});
