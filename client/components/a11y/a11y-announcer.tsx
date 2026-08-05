"use client";

/**
 * A11yAnnouncer — fire a polite/assertive message cho screen reader.
 * Dùng khi có thay đổi quan trọng (form submit success/error, copy to clipboard, ...).
 */
import { useEffect, useState } from "react";

let externalSetAnnounce: ((msg: string, priority?: "polite" | "assertive") => void) | null = null;

export function announce(message: string, priority: "polite" | "assertive" = "polite") {
  externalSetAnnounce?.(message, priority);
}

export function A11yAnnouncer() {
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"polite" | "assertive">("polite");

  useEffect(() => {
    externalSetAnnounce = (msg, p) => {
      setMessage("");
      // Force a re-render
      requestAnimationFrame(() => {
        setMessage(msg);
        setPriority(p ?? "polite");
      });
    };
    return () => {
      externalSetAnnounce = null;
    };
  }, []);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
