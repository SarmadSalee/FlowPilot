import { useEffect, useRef, useState } from "react";
import { BASE } from "@/lib/api";
import useAuth from "@/store/auth";
import type { LeadStreamEvent } from "@/lib/types";

/**
 * Subscribes to the live lead intelligence feed over SSE.
 * Auth is passed as a query token because EventSource cannot set headers.
 */
export function useLeadStream(enabled = true) {
  const token = useAuth((s) => s.token);
  const [events, setEvents] = useState<LeadStreamEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const ref = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;

    const es = new EventSource(`${BASE}/api/leads/stream?token=${encodeURIComponent(token)}`);
    ref.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data) as LeadStreamEvent;
        if (cancelled) return;
        setEvents((prev) => [evt, ...prev].slice(0, 200));
      } catch {
        /* ignore malformed frames */
      }
    };

    return () => {
      cancelled = true;
      es.close();
      ref.current = null;
    };
  }, [enabled, token]);

  return { events, connected };
}