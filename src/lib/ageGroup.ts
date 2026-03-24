// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { differenceInYears } from "date-fns";
import { AgeGroup } from "@/generated/prisma/client";

export function getAgeGroup(dob: Date): AgeGroup {
  const age = differenceInYears(new Date(), dob);
  if (age < 16) return AgeGroup.CHILD;
  if (age < 18) return AgeGroup.TEEN;
  return AgeGroup.ADULT;
}
