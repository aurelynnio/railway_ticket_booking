import QRCode from "qrcode";

/**
 * Local QR generation (Direction B, R9) — replaces the third-party
 * api.qrserver.com CDN so e-tickets render offline and no external service
 * sees ticket payloads. Dark ink on white for scannability at the gate.
 */
export async function generateQrDataUrl(
  value: string,
  size = 200,
): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: size,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
