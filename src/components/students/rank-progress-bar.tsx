"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getHoursProgress } from "@/lib/advancement";

interface RankProgressBarProps {
  totalHours: number;
}

export function RankProgressBar({ totalHours }: RankProgressBarProps) {
  const { hours, remaining, percent } = getHoursProgress(totalHours);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">
          {hours.toFixed(1)} / 2,000 hrs
        </span>
        <span className="text-xs font-medium text-gray-500">{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {remaining > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {remaining.toFixed(1)} hours remaining to advance
        </p>
      )}
      {remaining === 0 && (
        <p className="text-xs text-green-600 mt-1 font-medium">
          Eligible for advancement!
        </p>
      )}
    </div>
  );
}
