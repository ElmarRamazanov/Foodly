import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beslenme Planlayıcı — Haftalık Diyet Planı",
  description:
    "Günlük kalori hedefinize göre otomatik haftalık beslenme planı oluşturun. Glütensiz seçenekler, anlık kalori hesaplama.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
