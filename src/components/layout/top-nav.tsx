"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { useSession } from "next-auth/react";
import { GymSwitcher } from "./gym-switcher";
import { Badge } from "@/components/ui/badge";

const roleVariant: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  OWNER: "danger",
  ADMIN: "warning",
  INSTRUCTOR: "info",
  STUDENT: "success",
};

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <GymSwitcher />
        <div className="flex items-center gap-3">
          {session?.user && (
            <>
              <Badge variant={roleVariant[session.user.role] ?? "default"}>
                {session.user.role}
              </Badge>
              <span className="text-sm text-gray-700 font-medium">
                {session.user.email}
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
