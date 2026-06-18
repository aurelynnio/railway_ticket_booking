import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const bodyFont = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Railway Hub",
  description: "Tra cứu chuyến, đặt vé, thanh toán và theo dõi đơn hàng tàu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${bodyFont.variable} ${monoFont.variable} ${headingFont.variable} h-full`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
