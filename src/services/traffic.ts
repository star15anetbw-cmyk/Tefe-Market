import { supabase } from '../lib/supabase';
import { isNonCriticalSupabaseError } from '../lib/utils';

const SESSION_ID_KEY = 'tefe_session_id';
const TRAFFIC_THROTTLE_PREFIX = 'tefe_traffic_last_seen';
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function getSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;

    const sessionId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(SESSION_ID_KEY, sessionId);
    return sessionId;
  } catch {
    return null;
  }
}

function shouldRegisterOrigem(origem: string) {
  try {
    const key = `${TRAFFIC_THROTTLE_PREFIX}:${origem}`;
    const lastSeen = Number(localStorage.getItem(key) || 0);
    const now = Date.now();

    if (lastSeen && now - lastSeen < THIRTY_MINUTES_MS) return false;

    localStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
}

export async function registerTraffic() {
  const params = new URLSearchParams(window.location.search);
  const origem = params.get('origem')?.trim();

  if (!origem || !shouldRegisterOrigem(origem)) return;

  try {
    const { error } = await supabase
      .from('traffic_events')
      .insert([{
        origem,
        session_id: getSessionId(),
        path: window.location.pathname,
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      }]);

    if (error && !isNonCriticalSupabaseError(error)) {
      console.warn('Traffic tracking failed:', error);
    }
  } catch (err) {
    if (!isNonCriticalSupabaseError(err)) {
      console.warn('Unexpected traffic tracking error:', err);
    }
  }
}
