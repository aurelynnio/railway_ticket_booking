"use client";

import Image from "next/image";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Renders a QR code using a CDN-based QR generation API.
 * No additional npm packages required.
 * The domain api.qrserver.com is configured in next.config.ts.
 */
export function QrCode({ value, size = 200, className }: QrCodeProps) {
  const encoded = encodeURIComponent(value);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=svg&margin=4`;

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: "relative" }}
    >
      <Image
        src={src}
        alt={`QR code for ${value}`}
        width={size}
        height={size}
        className="block"
        unoptimized
      />
    </div>
  );
}
