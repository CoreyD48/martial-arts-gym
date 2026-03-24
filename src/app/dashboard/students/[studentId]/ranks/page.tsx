"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RankBadge } from "@/components/students/rank-badge";
import { RankProgressBar } from "@/components/students/rank-progress-bar";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

interface StudentRank {
  id: string;
  category: string;
  grapplingStyle: string | null;
  strikingStyle: string | null;
  ageGroup: string;
  childRank: string | null;
  teenRank: string | null;
  adultRank: string | null;
  awardedAt: string;
}

interface RankHistory {
  id: string;
  category: string;
  grapplingStyle: string | null;
  strikingStyle: string | null;
  fromAdultRank: string | null;
  fromChildRank: string | null;
  fromTeenRank: string | null;
  toAdultRank: string | null;
  toChildRank: string | null;
  toTeenRank: string | null;
  hoursAtPromotion: number;
  awardedAt: string;
  awardedByName: string | null;
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  totalHours: number;
  currentRanks: StudentRank[];
}

export default function StudentRanksPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;
  const { data: session } = useSession();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [rankHistory, setRankHistory] = useState<RankHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [awardError, setAwardError] = useState<string | null>(null);
  const [awardLoading, setAwardLoading] = useState(false);

  // Award form state
  const [awardCategory, setAwardCategory] = useState("GRAPPLING");
  const [awardGrapplingStyle, setAwardGrapplingStyle] = useState("");
  const [awardStrikingStyle, setAwardStrikingStyle] = useState("");
  const [awardAdultRank, setAwardAdultRank] = useState("");
  const [awardChildRank, setAwardChildRank] = useState("");
  const [awardTeenRank, setAwardTeenRank] = useState("");

  useEffect(() => {
    async function load() {
      const [studentRes, ranksRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/students/${studentId}/ranks`),
      ]);
      const studentData = await studentRes.json();
      const ranksData = await ranksRes.json();
      setStudent(studentData);
      setRankHistory(ranksData.rankHistory ?? []);
      setLoading(false);
    }
    load();
  }, [studentId]);

  const handleAwardRank = async () => {
    setAwardError(null);
    setAwardLoading(true);

    const body: Record<string, string | null> = {
      category: awardCategory,
      grapplingStyle: awardCategory === "GRAPPLING" ? awardGrapplingStyle || null : null,
      strikingStyle: awardCategory === "STRIKING" ? awardStrikingStyle || null : null,
    };

    if (student?.ageGroup === "ADULT") body.adultRank = awardAdultRank || null;
    else if (student?.ageGroup === "TEEN") body.teenRank = awardTeenRank || null;
    else body.childRank = awardChildRank || null;

    const res = await fetch(`/api/students/${studentId}/ranks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setAwardLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setAwardError(err.error ?? "Failed to award rank");
      return;
    }

    setAwardModalOpen(false);
    // Refresh
    const [studentRes, ranksRes] = await Promise.all([
      fetch(`/api/students/${studentId}`),
      fetch(`/api/students/${studentId}/ranks`),
    ]);
    setStudent(await studentRes.json());
    const ranksData = await ranksRes.json();
    setRankHistory(ranksData.rankHistory ?? []);
  };

  const canAward =
    session?.user?.role === "OWNER" ||
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "INSTRUCTOR";

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!student) {
    return <div className="text-center py-12 text-gray-500">Student not found.</div>;
  }

  const getRankValue = (rank: StudentRank) =>
    rank.adultRank ?? rank.teenRank ?? rank.childRank ?? "None";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/students" className="hover:text-indigo-600">
            Students
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/students/${studentId}`}
            className="hover:text-indigo-600"
          >
            {student.firstName} {student.lastName}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Ranks</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ranks & Progression</h1>
          {canAward && (
            <Button onClick={() => setAwardModalOpen(true)}>Award Rank</Button>
          )}
        </div>
      </div>

      {/* Hours progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Advancement Hours
        </h2>
        <RankProgressBar totalHours={Number(student.totalHours)} />
        <p className="text-xs text-gray-400 mt-2">
          Family class hours do not count toward advancement.
        </p>
      </div>

      {/* Current ranks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Current Ranks
        </h2>
        {student.currentRanks.length === 0 ? (
          <p className="text-sm text-gray-500">No ranks awarded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {student.currentRanks.map((rank) => {
              const rankValue = getRankValue(rank);
              return (
                <div
                  key={rank.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    {rank.category}
                    {rank.grapplingStyle && ` — ${rank.grapplingStyle}`}
                    {rank.strikingStyle && ` — ${rank.strikingStyle}`}
                  </p>
                  {rankValue !== "None" ? (
                    <RankBadge
                      rank={rankValue as Parameters<typeof RankBadge>[0]["rank"]}
                      ageGroup={rank.ageGroup as Parameters<typeof RankBadge>[0]["ageGroup"]}
                      displayType={rank.category === "STRIKING" ? "shirt" : "belt"}
                    />
                  ) : (
                    <span className="text-sm text-gray-400">Not set</span>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Awarded {format(new Date(rank.awardedAt), "MMM d, yyyy")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rank history */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Rank History</h2>
        </div>
        {rankHistory.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500">No history yet.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discipline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Awarded By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankHistory.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {format(new Date(h.awardedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {h.category}
                    {h.grapplingStyle && ` / ${h.grapplingStyle}`}
                    {h.strikingStyle && ` / ${h.strikingStyle}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {h.fromAdultRank ?? h.fromTeenRank ?? h.fromChildRank ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {h.toAdultRank ?? h.toTeenRank ?? h.toChildRank ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {Number(h.hoursAtPromotion).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {h.awardedByName ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Award Rank Modal */}
      <Modal
        open={awardModalOpen}
        onClose={() => setAwardModalOpen(false)}
        title="Award Rank"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={awardCategory}
              onChange={(e) => setAwardCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="GRAPPLING">Grappling</option>
              <option value="STRIKING">Striking</option>
            </select>
          </div>

          {awardCategory === "GRAPPLING" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grappling Style
              </label>
              <select
                value={awardGrapplingStyle}
                onChange={(e) => setAwardGrapplingStyle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Any / All</option>
                <option value="WRESTLING">Wrestling</option>
                <option value="JUDO">Judo</option>
                <option value="JIU_JITSU_GI">Jiu-Jitsu (Gi)</option>
                <option value="JIU_JITSU_NOGI">Jiu-Jitsu (No-Gi)</option>
              </select>
            </div>
          )}

          {awardCategory === "STRIKING" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Striking Style
              </label>
              <select
                value={awardStrikingStyle}
                onChange={(e) => setAwardStrikingStyle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Any / All</option>
                <option value="KICKBOXING">Kickboxing</option>
                <option value="MUAY_THAI">Muay Thai</option>
              </select>
              <p className="text-xs text-amber-600 mt-1">
                Boxing has no rank system.
              </p>
            </div>
          )}

          {student.ageGroup === "ADULT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adult Rank
              </label>
              <select
                value={awardAdultRank}
                onChange={(e) => setAwardAdultRank(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select rank...</option>
                <option value="WHITE">White Belt</option>
                <option value="BLUE">Blue Belt</option>
                <option value="PURPLE">Purple Belt</option>
                <option value="BROWN">Brown Belt</option>
                <option value="BLACK">Black Belt</option>
                <option value="BLACK_2ND">Black Belt 2nd</option>
                <option value="BLACK_3RD">Black Belt 3rd</option>
                <option value="BLACK_4TH">Black Belt 4th</option>
                <option value="BLACK_5TH">Black Belt 5th</option>
                <option value="BLACK_6TH">Black Belt 6th</option>
                <option value="RED_BLACK">Red/Black Belt</option>
                <option value="RED_WHITE">Red/White Belt</option>
                <option value="RED">Red Belt</option>
              </select>
            </div>
          )}

          {student.ageGroup === "TEEN" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teen Rank
              </label>
              <select
                value={awardTeenRank}
                onChange={(e) => setAwardTeenRank(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select rank...</option>
                <option value="PURPLE">Purple Belt</option>
                <option value="BROWN">Brown Belt</option>
              </select>
            </div>
          )}

          {student.ageGroup === "CHILD" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child Rank
              </label>
              <select
                value={awardChildRank}
                onChange={(e) => setAwardChildRank(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select rank...</option>
                <option value="WHITE">White</option>
                <option value="WHITE_WHITE">White/White</option>
                <option value="GREY">Grey</option>
                <option value="GREY_BLACK">Grey/Black</option>
                <option value="YELLOW_WHITE">Yellow/White</option>
                <option value="YELLOW">Yellow</option>
                <option value="YELLOW_BLACK">Yellow/Black</option>
                <option value="ORANGE_WHITE">Orange/White</option>
                <option value="ORANGE">Orange</option>
                <option value="ORANGE_BLACK">Orange/Black</option>
                <option value="GREEN_WHITE">Green/White</option>
                <option value="GREEN">Green</option>
                <option value="GREEN_BLACK">Green/Black</option>
              </select>
            </div>
          )}

          {awardError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{awardError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleAwardRank} loading={awardLoading}>
              Award Rank
            </Button>
            <Button
              variant="secondary"
              onClick={() => setAwardModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
