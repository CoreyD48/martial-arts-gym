// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { AccountStatus } from "@/generated/prisma/client";

interface HoldBadgeProps {
  accountStatus: AccountStatus;
}

export function HoldBadge({ accountStatus }: HoldBadgeProps) {
  if (accountStatus !== AccountStatus.ON_HOLD) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
      ON HOLD
    </span>
  );
}
