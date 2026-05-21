import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farline Nabídky",
  description: "Interaktivní tvůrce cenových nabídek pro architekty",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@500,600,700&display=swap"
        />
      </head>
      <body className="min-h-full">
        <style>{`:root { --font-display: 'Satoshi', ${"'Geist'"}, system-ui, sans-serif; }`}</style>
        {children}
      </body>
    </html>
  );
}
