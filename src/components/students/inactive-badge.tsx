// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { differenceInDays } from "date-fns";

interface InactiveBadgeProps {
  lastAttendance: Date | string | null | undefined;
}

export function InactiveBadge({ lastAttendance }: InactiveBadgeProps) {
  if (!lastAttendance) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        INACTIVE 2W+
      </span>
    );
  }

  const last = new Date(lastAttendance);
  const daysSince = differenceInDays(new Date(), last);

  if (daysSince > 14) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        INACTIVE 2W+
      </span>
    );
  }

  return null;
}
