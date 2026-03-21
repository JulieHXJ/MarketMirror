import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Website Intelligence Report",
  description: "AI-powered product intelligence report covering UX, Conversion, Business Logic, and Growth Potential.",
};

export const maxDuration = 60; // Set Vercel execution timeout to max for Hobby tier (60s)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
