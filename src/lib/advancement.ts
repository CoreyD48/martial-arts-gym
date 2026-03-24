// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

export const HOURS_TO_ADVANCE = 2000;

export function getHoursProgress(totalHours: number): {
  hours: number;
  remaining: number;
  percent: number;
} {
  const hours = Math.max(0, totalHours);
  const remaining = Math.max(0, HOURS_TO_ADVANCE - hours);
  const percent = Math.min(100, Math.round((hours / HOURS_TO_ADVANCE) * 100));
  return { hours, remaining, percent };
}
