import { httpClient } from './httpClient';

type TrackEventInput = {
  event: string;
  userId: string;
  payload?: Record<string, unknown> | string | null;
  occurredAt?: string;
};

/**
 * Envia um evento de analytics para o backend (POST /api/events).
 * Fire-and-forget: falhas de analytics nunca afetam a experiência do usuário.
 */
export function trackEvent({ event, userId, payload, occurredAt }: TrackEventInput) {
  if (!userId) return;

  const normalizedPayload =
    payload === undefined || payload === null
      ? null
      : typeof payload === 'string'
        ? payload
        : JSON.stringify(payload);

  try {
    void httpClient<unknown>('/api/events', {
      method: 'POST',
      userId,
      body: JSON.stringify({
        event,
        userId,
        payload: normalizedPayload,
        occurredAt: occurredAt ?? new Date().toISOString(),
      }),
    }).catch(() => {
      // Analytics nunca deve quebrar o fluxo do produto.
    });
  } catch {
    // Ignora falhas síncronas (ex.: JSON serialization).
  }
}
