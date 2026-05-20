import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'NearDrop',
  description: 'Instant local file sharing — no account required',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#fafaf9',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className="bg-stone-50 text-stone-900 min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
