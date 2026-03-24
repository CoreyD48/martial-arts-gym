// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import { ReportsCharts } from "./reports-charts";
import { PaymentStatus } from "@/generated/prisma/client";

export default async function ReportsPage() {
  // Monthly revenue for last 6 months
  const now = new Date();
  const monthlyRevenue: Array<{ month: string; revenue: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const result = await prisma.payment.aggregate({
      where: {
        billingMonth: { gte: start, lt: end },
        status: PaymentStatus.PAID,
      },
      _sum: { amountPaid: true },
    });
    monthlyRevenue.push({
      month: start.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      revenue: Number(result._sum.amountPaid ?? 0),
    });
  }

  // Attendance by gym for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const gyms = await prisma.gym.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const attendanceByGym: Array<{ gym: string; count: number }> = [];
  for (const gym of gyms) {
    const count = await prisma.attendance.count({
      where: {
        checkedInAt: { gte: thirtyDaysAgo },
        session: { class: { gymId: gym.id } },
      },
    });
    attendanceByGym.push({ gym: gym.name, count });
  }

  // Rank distribution for adults
  const adultRankGroups = await prisma.studentRank.groupBy({
    by: ["adultRank"],
    where: { ageGroup: "ADULT", adultRank: { not: null } },
    _count: true,
  });

  const rankDistribution = adultRankGroups
    .filter((r) => r.adultRank !== null)
    .map((r) => ({
      rank: r.adultRank as string,
      count: r._count,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Analytics and insights for your gym operations
        </p>
      </div>
      <ReportsCharts
        monthlyRevenue={monthlyRevenue}
        attendanceByGym={attendanceByGym}
        rankDistribution={rankDistribution}
      />
    </div>
  );
}
