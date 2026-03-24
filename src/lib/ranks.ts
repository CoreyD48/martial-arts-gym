// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import {
  AgeGroup,
  AdultRank,
  ChildRank,
  TeenRank,
  MembershipType,
  StudentRank,
  UserRole,
} from "@/generated/prisma/browser";

export const MEMBERSHIP_FEES: Record<MembershipType, number> = {
  GRAPPLING: 220,
  STRIKING: 220,
  BOTH: 275,
  CHILDREN: 125,
  FAMILY: 450,
};

export const CHILD_RANKS: ChildRank[] = [
  ChildRank.WHITE,
  ChildRank.WHITE_WHITE,
  ChildRank.GREY,
  ChildRank.GREY_BLACK,
  ChildRank.YELLOW_WHITE,
  ChildRank.YELLOW,
  ChildRank.YELLOW_BLACK,
  ChildRank.ORANGE_WHITE,
  ChildRank.ORANGE,
  ChildRank.ORANGE_BLACK,
  ChildRank.GREEN_WHITE,
  ChildRank.GREEN,
  ChildRank.GREEN_BLACK,
];

export const TEEN_RANKS: TeenRank[] = [TeenRank.PURPLE, TeenRank.BROWN];

export const ADULT_RANKS: AdultRank[] = [
  AdultRank.WHITE,
  AdultRank.BLUE,
  AdultRank.PURPLE,
  AdultRank.BROWN,
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

export function getRankLabel(
  rank: ChildRank | TeenRank | AdultRank
): string {
  const labels: Record<string, string> = {
    // ChildRank
    [ChildRank.WHITE]: "White Belt",
    [ChildRank.WHITE_WHITE]: "White/White Belt",
    [ChildRank.GREY]: "Grey Belt",
    [ChildRank.GREY_BLACK]: "Grey/Black Belt",
    [ChildRank.YELLOW_WHITE]: "Yellow/White Belt",
    [ChildRank.YELLOW]: "Yellow Belt",
    [ChildRank.YELLOW_BLACK]: "Yellow/Black Belt",
    [ChildRank.ORANGE_WHITE]: "Orange/White Belt",
    [ChildRank.ORANGE]: "Orange Belt",
    [ChildRank.ORANGE_BLACK]: "Orange/Black Belt",
    [ChildRank.GREEN_WHITE]: "Green/White Belt",
    [ChildRank.GREEN]: "Green Belt",
    [ChildRank.GREEN_BLACK]: "Green/Black Belt",
    // TeenRank
    [TeenRank.PURPLE]: "Purple Belt",
    [TeenRank.BROWN]: "Brown Belt",
    // AdultRank
    [AdultRank.WHITE]: "White Belt",
    [AdultRank.BLUE]: "Blue Belt",
    [AdultRank.PURPLE]: "Purple Belt",
    [AdultRank.BROWN]: "Brown Belt",
    [AdultRank.BLACK]: "Black Belt",
    [AdultRank.BLACK_2ND]: "Black Belt (2nd)",
    [AdultRank.BLACK_3RD]: "Black Belt (3rd)",
    [AdultRank.BLACK_4TH]: "Black Belt (4th)",
    [AdultRank.BLACK_5TH]: "Black Belt (5th)",
    [AdultRank.BLACK_6TH]: "Black Belt (6th)",
    [AdultRank.RED_BLACK]: "Red/Black Belt (7th)",
    [AdultRank.RED_WHITE]: "Red/White Belt (8th)",
    [AdultRank.RED]: "Red Belt (9th)",
  };
  return labels[rank] ?? rank;
}

export function getRankColor(rank: ChildRank | TeenRank | AdultRank): string {
  const colors: Record<string, string> = {
    // ChildRank
    [ChildRank.WHITE]: "#ffffff",
    [ChildRank.WHITE_WHITE]: "#ffffff",
    [ChildRank.GREY]: "#9ca3af",
    [ChildRank.GREY_BLACK]: "#6b7280",
    [ChildRank.YELLOW_WHITE]: "#fde68a",
    [ChildRank.YELLOW]: "#fbbf24",
    [ChildRank.YELLOW_BLACK]: "#d97706",
    [ChildRank.ORANGE_WHITE]: "#fed7aa",
    [ChildRank.ORANGE]: "#f97316",
    [ChildRank.ORANGE_BLACK]: "#ea580c",
    [ChildRank.GREEN_WHITE]: "#bbf7d0",
    [ChildRank.GREEN]: "#22c55e",
    [ChildRank.GREEN_BLACK]: "#16a34a",
    // TeenRank
    [TeenRank.PURPLE]: "#7e22ce",
    [TeenRank.BROWN]: "#78350f",
    // AdultRank
    [AdultRank.WHITE]: "#ffffff",
    [AdultRank.BLUE]: "#1e40af",
    [AdultRank.PURPLE]: "#7e22ce",
    [AdultRank.BROWN]: "#78350f",
    [AdultRank.BLACK]: "#000000",
    [AdultRank.BLACK_2ND]: "#000000",
    [AdultRank.BLACK_3RD]: "#000000",
    [AdultRank.BLACK_4TH]: "#000000",
    [AdultRank.BLACK_5TH]: "#000000",
    [AdultRank.BLACK_6TH]: "#000000",
    [AdultRank.RED_BLACK]: "#dc2626",
    [AdultRank.RED_WHITE]: "#dc2626",
    [AdultRank.RED]: "#dc2626",
  };
  return colors[rank] ?? "#9ca3af";
}

export function isAdvancedRank(studentRank: StudentRank): boolean {
  if (studentRank.ageGroup === AgeGroup.ADULT && studentRank.adultRank) {
    const advancedAdult: AdultRank[] = [
      AdultRank.PURPLE,
      AdultRank.BROWN,
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
    return advancedAdult.includes(studentRank.adultRank);
  }
  if (studentRank.ageGroup === AgeGroup.CHILD && studentRank.childRank) {
    const advancedChild: ChildRank[] = [
      ChildRank.GREEN_WHITE,
      ChildRank.GREEN,
      ChildRank.GREEN_BLACK,
    ];
    return advancedChild.includes(studentRank.childRank);
  }
  return false;
}

// INSTRUCTOR cannot award BLACK or above; OWNER/ADMIN can award any rank
export function canAwardRank(
  actorRole: UserRole,
  targetAdultRank: AdultRank | null | undefined
): boolean {
  if (actorRole === UserRole.OWNER || actorRole === UserRole.ADMIN) {
    return true;
  }
  if (actorRole === UserRole.INSTRUCTOR) {
    if (!targetAdultRank) return true;
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
    return !blackAndAbove.includes(targetAdultRank);
  }
  return false;
}

export function getNextRank(
  current: ChildRank | TeenRank | AdultRank | null | undefined,
  ageGroup: AgeGroup
): ChildRank | TeenRank | AdultRank | null {
  if (ageGroup === AgeGroup.CHILD) {
    if (!current) return ChildRank.WHITE;
    const idx = CHILD_RANKS.indexOf(current as ChildRank);
    if (idx === -1 || idx === CHILD_RANKS.length - 1) return null;
    return CHILD_RANKS[idx + 1];
  }
  if (ageGroup === AgeGroup.TEEN) {
    if (!current) return TeenRank.PURPLE;
    const idx = TEEN_RANKS.indexOf(current as TeenRank);
    if (idx === -1 || idx === TEEN_RANKS.length - 1) return null;
    return TEEN_RANKS[idx + 1];
  }
  // ADULT
  if (!current) return AdultRank.WHITE;
  const idx = ADULT_RANKS.indexOf(current as AdultRank);
  if (idx === -1 || idx === ADULT_RANKS.length - 1) return null;
  return ADULT_RANKS[idx + 1];
}
