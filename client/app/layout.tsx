import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/**
 * Typography strategy — Mekong Line Design System
 *
 * Two-tier font system with Poppins:
 *   - Sans / Display: Poppins (300/400/500/600/700/800)
 *     Editorial headlines, page titles, card titles, UI body, labels,
 *     navigation, form controls, data tables. Geometric, modern, warm,
 *     highly legible with distinctive rounded terminals.
 *   - Mono: JetBrains Mono (400/500/600)
 *     Ticket numbers, seat labels, order IDs, prices, timestamps, code.
 *     Distinctive character, tabular alignment for scan-reading.
 *
 * Both include vietnamese subset for full Vietnamese language support.
 */
const poppinsFont = Poppins({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const poppinsDisplayFont = Poppins({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mekong Line — Đặt vé tàu trực tuyến",
  description:
    "Tìm chuyến, chọn ghế, thanh toán và nhận vé điện tử cho hành trình đường sắt Bắc-Nam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${poppinsFont.variable} ${poppinsDisplayFont.variable} ${monoFont.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Bỏ qua đến nội dung chính
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
