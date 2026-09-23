import type { Metadata } from "next";
import { Allura, Fraunces, Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const allura = Allura({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "ZsaNa Photo - Családi és intézményi fotózás",
    template: "%s | ZsaNa Photo",
  },
  description:
    "Családi és intézményi fotózás természetes, időtálló képekkel. Foglalj időpontot online.",
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: "ZsaNa Photo",
    title: "ZsaNa Photo - Családi és intézményi fotózás",
    description:
      "Családi és intézményi fotózás természetes, időtálló képekkel. Foglalj időpontot online.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="hu"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${allura.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
