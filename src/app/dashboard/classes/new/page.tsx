"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  gymId: z.string().min(1, "Gym is required"),
  instructorId: z.string().optional(),
  category: z.enum(["GRAPPLING", "STRIKING", "FAMILY"]),
  grapplingStyle: z.string().optional(),
  strikingStyle: z.string().optional(),
  skillLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  ageGroup: z.string().optional(),
  dayOfWeek: z.string().min(0),
  startTime: z.string().min(1, "Start time is required"),
  durationMinutes: z.string().min(1, "Duration is required"),
  countsTowardAdvancement: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Gym { id: string; name: string }
interface Instructor { id: string; firstName: string; lastName: string }

export default function NewClassPage() {
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { countsTowardAdvancement: true },
  });

  const category = watch("category");

  useEffect(() => {
    Promise.all([
      fetch("/api/gyms").then((r) => r.json()),
      fetch("/api/instructors").then((r) => r.json()),
    ]).then(([gymData, instructorData]) => {
      if (Array.isArray(gymData)) setGyms(gymData);
      if (Array.isArray(instructorData)) setInstructors(instructorData);
    });
  }, []);

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        dayOfWeek: parseInt(data.dayOfWeek, 10),
        durationMinutes: parseInt(data.durationMinutes, 10),
        grapplingStyle: data.grapplingStyle || null,
        strikingStyle: data.strikingStyle || null,
        instructorId: data.instructorId || null,
        ageGroup: data.ageGroup || null,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setServerError(err.error ?? "Failed to create class");
      return;
    }

    const cls = await res.json();
    router.push(`/dashboard/classes/${cls.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/classes" className="hover:text-indigo-600">Classes</Link>
          <span>/</span>
          <span className="text-gray-900">New Class</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Class</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <Input label="Class Name" {...register("name")} error={errors.name?.message} />

        <Select label="Gym" {...register("gymId")} error={errors.gymId?.message}>
          <option value="">Select gym...</option>
          {gyms.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>

        <Select label="Instructor (optional)" {...register("instructorId")}>
          <option value="">No instructor assigned</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
          ))}
        </Select>

        <Select label="Category" {...register("category")} error={errors.category?.message}>
          <option value="">Select category...</option>
          <option value="GRAPPLING">Grappling</option>
          <option value="STRIKING">Striking</option>
          <option value="FAMILY">Family</option>
        </Select>

        {category === "GRAPPLING" && (
          <Select label="Grappling Style (optional)" {...register("grapplingStyle")}>
            <option value="">General Grappling</option>
            <option value="WRESTLING">Wrestling</option>
            <option value="JUDO">Judo</option>
            <option value="JIU_JITSU_GI">Jiu-Jitsu (Gi)</option>
            <option value="JIU_JITSU_NOGI">Jiu-Jitsu (No-Gi)</option>
          </Select>
        )}

        {category === "STRIKING" && (
          <Select label="Striking Style (optional)" {...register("strikingStyle")}>
            <option value="">General Striking</option>
            <option value="BOXING">Boxing</option>
            <option value="KICKBOXING">Kickboxing</option>
            <option value="MUAY_THAI">Muay Thai</option>
          </Select>
        )}

        <Select label="Skill Level" {...register("skillLevel")} error={errors.skillLevel?.message}>
          <option value="">Select level...</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </Select>

        <Select label="Age Group (optional)" {...register("ageGroup")}>
          <option value="">All ages</option>
          <option value="CHILD">Child</option>
          <option value="TEEN">Teen</option>
          <option value="ADULT">Adult</option>
        </Select>

        <Select label="Day of Week" {...register("dayOfWeek")} error={errors.dayOfWeek?.message}>
          <option value="">Select day...</option>
          <option value="0">Sunday</option>
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
        </Select>

        <Input
          label="Start Time (e.g. 09:00)"
          {...register("startTime")}
          error={errors.startTime?.message}
          placeholder="09:00"
        />

        <Input
          label="Duration (minutes)"
          type="number"
          {...register("durationMinutes")}
          error={errors.durationMinutes?.message}
          placeholder="60"
        />

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            {...register("countsTowardAdvancement")}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Counts toward advancement hours
        </label>

        {serverError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Create Class</Button>
          <Link href="/dashboard/classes" className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
