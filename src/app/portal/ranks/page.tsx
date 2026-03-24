// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RankBadge } from "@/components/students/rank-badge";
import { RankProgressBar } from "@/components/students/rank-progress-bar";
import { AgeGroup, ChildRank, TeenRank, AdultRank } from "@/generated/prisma/client";
import { format } from "date-fns";

export default async function PortalRanksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.studentId) redirect("/login");

  const student = await prisma.student.findUnique({
    where: { id: session.user.studentId },
    include: { currentRanks: true },
  });

  if (!student) redirect("/login");

  const rankHistory = await prisma.rankHistory.findMany({
    where: { studentId: session.user.studentId },
    orderBy: { awardedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Ranks</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your rank progression across all disciplines
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Advancement Progress
        </h2>
        <RankProgressBar totalHours={Number(student.totalHours)} />
        <p className="text-xs text-gray-400 mt-2">
          Family class hours are excluded from advancement counting.
        </p>
      </div>

      {/* Current Ranks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Current Ranks
        </h2>
        {student.currentRanks.length === 0 ? (
          <p className="text-sm text-gray-500">No ranks awarded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {student.currentRanks.map((rank) => {
              const rankValue = rank.adultRank ?? rank.teenRank ?? rank.childRank;
              if (!rankValue) return null;
              return (
                <div
                  key={rank.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {rank.category}
                    {rank.grapplingStyle && ` / ${rank.grapplingStyle}`}
                    {rank.strikingStyle && ` / ${rank.strikingStyle}`}
                  </p>
                  <RankBadge
                    rank={rankValue as ChildRank | TeenRank | AdultRank}
                    ageGroup={rank.ageGroup as AgeGroup}
                    displayType={rank.category === "STRIKING" ? "shirt" : "belt"}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Awarded {format(new Date(rank.awardedAt), "MMM d, yyyy")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      {rankHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Rank History
          </h2>
          <div className="space-y-3">
            {rankHistory.map((h) => (
              <div
                key={h.id}
                className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {h.category}
                    {h.grapplingStyle && ` / ${h.grapplingStyle}`}
                    {h.strikingStyle && ` / ${h.strikingStyle}`}
                    {" "}
                    <span className="font-normal text-gray-500">
                      {h.toAdultRank ?? h.toTeenRank ?? h.toChildRank ?? "rank awarded"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(h.awardedAt), "MMMM d, yyyy")} &bull;{" "}
                    {Number(h.hoursAtPromotion).toFixed(1)} hours
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
