"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface Gym { id: string; name: string }
interface ClassItem {
  id: string;
  name: string;
  startTime: string;
  durationMinutes: number;
  category: string;
  sessions: Array<{ id: string; sessionDate: string }>;
}
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  accountStatus: string;
}

export default function QuickAttendancePage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGymId, setSelectedGymId] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/gyms")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGyms(data);
      });
  }, []);

  useEffect(() => {
    if (!selectedGymId) {
      setClasses([]);
      setStudents([]);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`/api/classes?gymId=${selectedGymId}`).then((r) => r.json()),
      fetch(`/api/students?gymId=${selectedGymId}`).then((r) => r.json()),
    ]).then(([classData, studentData]) => {
      if (Array.isArray(classData)) setClasses(classData);
      if (Array.isArray(studentData)) setStudents(studentData);
      setLoading(false);
    });
  }, [selectedGymId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const todaySessions = selectedClass?.sessions ?? [];

  const handleToggle = (studentId: string) => {
    setCheckedIn((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const handleCreateAndLog = async () => {
    if (!selectedClassId) return;
    setSubmitting(true);
    setResult(null);

    let sessionId = selectedSessionId;

    // Create session for today if none selected
    if (!sessionId) {
      const sessionRes = await fetch(
        `/api/classes/${selectedClassId}/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionDate: today }),
        }
      );
      const sessionData = await sessionRes.json();
      sessionId = sessionData.id;
    }

    const res = await fetch(
      `/api/classes/${selectedClassId}/sessions/${sessionId}/attendance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(checkedIn) }),
      }
    );

    const data = await res.json();
    setSubmitting(false);
    setCheckedIn(new Set());

    if (!res.ok) {
      setResult(`Error: ${data.error}`);
    } else {
      setResult(
        `Successfully logged ${data.recorded} attendance(s) for ${checkedIn.size} students.`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quick Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">
          Select a gym and class to log today's attendance.
        </p>
      </div>

      {/* Gym select */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Gym
          </label>
          <select
            value={selectedGymId}
            onChange={(e) => {
              setSelectedGymId(e.target.value);
              setSelectedClassId("");
              setSelectedSessionId("");
              setCheckedIn(new Set());
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Choose a gym...</option>
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {selectedGymId && !loading && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSessionId("");
                setCheckedIn(new Set());
              }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Choose a class...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.startTime})
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedClassId && todaySessions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session (optional — leave blank to create new)
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Create new session for today</option>
              {todaySessions.map((s) => (
                <option key={s.id} value={s.id}>{s.sessionDate}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Student checklist */}
      {selectedClassId && students.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Students ({checkedIn.size} selected)
            </h2>
            <Button
              onClick={handleCreateAndLog}
              loading={submitting}
              disabled={checkedIn.size === 0}
            >
              Log Attendance
            </Button>
          </div>

          {result && (
            <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">{result}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {students.map((student) => {
              const isChecked = checkedIn.has(student.id);
              return (
                <button
                  key={student.id}
                  onClick={() => handleToggle(student.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    isChecked
                      ? "bg-indigo-50 border-indigo-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isChecked ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {student.firstName} {student.lastName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
