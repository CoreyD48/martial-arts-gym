// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

// Force all portal pages to render dynamically — they query the DB and require auth.
// Without this, Next.js attempts static generation at build time and fails without DATABASE_URL.
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
                OW
              </div>
              <span className="font-semibold text-gray-900 text-sm">
                One Way Martial Arts
              </span>
            </div>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link href="/portal" className="text-gray-600 hover:text-indigo-600">
                Dashboard
              </Link>
              <Link href="/portal/attendance" className="text-gray-600 hover:text-indigo-600">
                Attendance
              </Link>
              <Link href="/portal/ranks" className="text-gray-600 hover:text-indigo-600">
                Ranks
              </Link>
              <Link href="/portal/payments" className="text-gray-600 hover:text-indigo-600">
                Payments
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
