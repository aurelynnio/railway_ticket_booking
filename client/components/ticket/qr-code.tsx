"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode as QrIcon } from "lucide-react";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function TicketQRCode({ value, size = 180, className = "" }: QRCodeProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      setSvg(null);
      return;
    }

    QRCode.toString(value, {
      type: "svg",
      width: size,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((svgString) => {
        if (isMounted) {
          setSvg(svgString);
          setError(false);
        }
      })
      .catch((err) => {
        console.error("Failed to generate offline QR code:", err);
        if (isMounted) {
          setError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (error || !value) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center text-ink-muted ${className}`}
      >
        <QrIcon className="size-8 text-ink-subtle" />
        <p className="mt-2 text-xs">Không thể tạo mã QR</p>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-xl bg-muted/30 animate-pulse ${className}`}
      >
        <QrIcon className="size-8 text-ink-subtle animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`inline-block overflow-hidden rounded-xl border border-border bg-white p-2.5 shadow-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

