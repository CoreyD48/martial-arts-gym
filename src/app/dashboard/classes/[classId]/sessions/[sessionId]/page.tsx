"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  studentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    ageGroup: string;
    accountStatus: string;
  };
  hoursLogged: number;
  checkedInAt: string;
}

interface SessionStudent {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  accountStatus: string;
}

interface ClassSession {
  id: string;
  sessionDate: string;
  notes: string | null;
  cancelledAt: string | null;
  class: {
    id: string;
    name: string;
    gymId: string;
    durationMinutes: number;
    gym: { id: string; name: string };
  };
  attendances: AttendanceRecord[];
}

export default function SessionAttendancePage() {
  const params = useParams<{ classId: string; sessionId: string }>();
  const { classId, sessionId } = params;

  const [session, setSession] = useState<ClassSession | null>(null);
  const [gymStudents, setGymStudents] = useState<SessionStudent[]>([]);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/classes/${classId}/sessions/${sessionId}`
      );
      const data: ClassSession = await res.json();
      setSession(data);

      // Load students enrolled at this gym
      const studentsRes = await fetch(
        `/api/students?gymId=${data.class.gymId}`
      );
      const studentsData = await studentsRes.json();
      setGymStudents(Array.isArray(studentsData) ? studentsData : []);

      // Pre-check already attended students
      const alreadyChecked = new Set(
        data.attendances.map((a) => a.studentId)
      );
      setCheckedIn(alreadyChecked);
      setLoading(false);
    }
    load();
  }, [classId, sessionId]);

  const toggleStudent = (studentId: string) => {
    setCheckedIn((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);

    const res = await fetch(
      `/api/classes/${classId}/sessions/${sessionId}/attendance`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: Array.from(checkedIn) }),
      }
    );

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setSubmitResult(`Error: ${data.error}`);
    } else {
      setSubmitResult(
        `Recorded ${data.recorded} attendance(s). ${data.skippedDuplicates} already logged.`
      );
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!session) {
    return <div className="text-center py-12 text-gray-500">Session not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/classes" className="hover:text-indigo-600">Classes</Link>
          <span>/</span>
          <Link href={`/dashboard/classes/${classId}`} className="hover:text-indigo-600">
            {session.class.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">
            {format(new Date(session.sessionDate), "MMM d, yyyy")}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Attendance Sheet
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {session.class.name} &bull; {session.class.gym.name} &bull;{" "}
          {format(new Date(session.sessionDate), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Students ({checkedIn.size} checked in)
          </h2>
          <Button onClick={handleSubmit} loading={submitting} size="sm">
            Save Attendance
          </Button>
        </div>

        {submitResult && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
            <p className="text-sm text-green-700">{submitResult}</p>
          </div>
        )}

        {gymStudents.length === 0 ? (
          <p className="text-sm text-gray-500">No students enrolled at this gym.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {gymStudents.map((student) => {
              const isChecked = checkedIn.has(student.id);
              const alreadyLogged = session.attendances.some(
                (a) => a.studentId === student.id
              );
              return (
                <button
                  key={student.id}
                  onClick={() => !alreadyLogged && toggleStudent(student.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    isChecked
                      ? "bg-indigo-50 border-indigo-300 text-indigo-900"
                      : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                  } ${alreadyLogged ? "opacity-75" : ""}`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isChecked
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-gray-300"
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{student.ageGroup}</p>
                    {alreadyLogged && (
                      <p className="text-xs text-green-600">Already logged</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
