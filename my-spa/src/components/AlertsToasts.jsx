import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function wsUrl(path) {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}${path}`;
}

export default function AlertsToasts() {
  const { session } = useAuth();
  const [toasts, setToasts] = useState([]);

  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const timerRef = useRef(null);

  function pushToast(msg) {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    const toast = { id, ...msg };

    setToasts((prev) => [toast, ...prev].slice(0, 6));

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }

  useEffect(() => {
    if (!session?.loaded || !session.isAdmin) return;

    let closedByCleanup = false;

    function connect() {
      const ws = new WebSocket(wsUrl("/ws/alerts/"));
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);

          if (data?.type === "connected") return;

          pushToast({
            title: data?.type || "alert",
            message: data?.message || "Нове сповіщення",
            ts: data?.ts,
          });
        } catch {
        }
      };

      ws.onclose = () => {
        if (closedByCleanup) return;

        const attempt = retryRef.current++;
        const delay = Math.min(10000, 1000 * Math.pow(2, attempt)); // 1s,2s,4s,8s,10s...
        timerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
      };
    }

    connect();

    return () => {
      closedByCleanup = true;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [session?.loaded, session?.isAdmin]);

  if (!session?.loaded || !session.isAdmin) return null;

  return (
    <div className="ws-toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className="ws-toast">
          <div className="ws-toast-title">{t.title}</div>
          <div className="ws-toast-message">{t.message}</div>
        </div>
      ))}
    </div>
  );
}