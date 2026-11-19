import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vayal Thunai — வயல் துணை",
  description:
    "Offline-friendly, Tamil-first farming advisory: weather alerts, mandi prices, crop calendar and a voice assistant grounded in approved agricultural sources.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vayal Thunai",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f5132",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <I18nProvider>
          <ServiceWorkerRegister />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
