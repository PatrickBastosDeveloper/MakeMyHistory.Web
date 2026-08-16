import { trackEvent } from '../../services/eventsService';

// Eventos aceitos pelo backend (POST /api/events) que podem vir da UI.
// Demais chamadas de track() seguem apenas como log local.
const KNOWN_EVENTS = new Set(['app_opened', 'story_copied', 'story_shared']);

export const track = (event: string, data?: unknown) => {
  // eslint-disable-next-line no-console
  console.log('[track]', event, data);

  if (!KNOWN_EVENTS.has(event)) return;

  const userId = window.localStorage.getItem('userId');
  if (!userId) return;

  const payload =
    data === undefined || data === null
      ? null
      : typeof data === 'string'
        ? data
        : JSON.stringify(data);

  trackEvent({ event, userId, payload });
};
