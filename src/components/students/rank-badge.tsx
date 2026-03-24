// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { AgeGroup, ChildRank, TeenRank, AdultRank } from "@/generated/prisma/client";
import { getRankColor, getRankLabel } from "@/lib/ranks";

interface RankBadgeProps {
  rank: ChildRank | TeenRank | AdultRank;
  ageGroup: AgeGroup;
  displayType?: "belt" | "shirt";
}

export function RankBadge({ rank, displayType = "belt" }: RankBadgeProps) {
  const color = getRankColor(rank);
  const label = getRankLabel(rank);

  // For white belt we add a border so it's visible on white backgrounds
  const needsBorder = color === "#ffffff";

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className="inline-block rounded"
        style={{
          backgroundColor: color,
          width: displayType === "belt" ? "32px" : "24px",
          height: displayType === "belt" ? "12px" : "24px",
          border: needsBorder ? "1px solid #d1d5db" : "none",
          flexShrink: 0,
        }}
        title={label}
      />
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </div>
  );
}
