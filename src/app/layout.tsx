import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kapsul — Photobooth privat untuk momenmu",
  description: "Kumpulkan foto autentik dari tamu lewat satu QR. Tanpa aplikasi, tanpa galeri publik.",
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
