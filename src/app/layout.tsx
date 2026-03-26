// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.
//
// runMigrations is called here with a top-level await so that `prisma migrate deploy`
// and `prisma db seed` execute before the app serves any requests. This replaces the
// previous approach of running migrations as a pre-deploy command, which failed because
// DATABASE_URL is not available at build/pre-deploy time — only at runtime.

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { runMigrations } from "@/lib/run-migrations";

// Top-level await: Next.js App Router server components support this natively.
// Migrations run once on first render before any route handler is invoked.
await runMigrations();

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "One Way Martial Arts",
  description: "Martial Arts Gym Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
