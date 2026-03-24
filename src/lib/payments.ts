// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { AdultRank, MembershipType } from "@/generated/prisma/client";
import { MEMBERSHIP_FEES } from "@/lib/ranks";

export function getMembershipFee(type: MembershipType): number {
  return MEMBERSHIP_FEES[type];
}

export function isBlackBeltRank(adultRank: AdultRank): boolean {
  const blackAndAbove: AdultRank[] = [
    AdultRank.BLACK,
    AdultRank.BLACK_2ND,
    AdultRank.BLACK_3RD,
    AdultRank.BLACK_4TH,
    AdultRank.BLACK_5TH,
    AdultRank.BLACK_6TH,
    AdultRank.RED_BLACK,
    AdultRank.RED_WHITE,
    AdultRank.RED,
  ];
  return blackAndAbove.includes(adultRank);
}
