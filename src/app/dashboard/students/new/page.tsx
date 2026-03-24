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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phone: z.string().optional(),
  membershipType: z.enum(["GRAPPLING", "STRIKING", "BOTH", "CHILDREN", "FAMILY"]),
  gymId: z.string().min(1, "Gym is required"),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Gym {
  id: string;
  name: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch("/api/gyms")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGyms(data);
      });
  }, []);

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      setServerError(err.error ?? "Failed to create student");
      return;
    }

    const student = await res.json();
    router.push(`/dashboard/students/${student.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/students" className="hover:text-indigo-600">
            Students
          </Link>
          <span>/</span>
          <span className="text-gray-900">New Student</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>

        <Input
          label="Email"
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />

        <Input
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />

        <Input
          label="Date of Birth"
          type="date"
          {...register("dateOfBirth")}
          error={errors.dateOfBirth?.message}
        />

        <Input
          label="Phone (optional)"
          type="tel"
          {...register("phone")}
          error={errors.phone?.message}
        />

        <Select
          label="Membership Type"
          {...register("membershipType")}
          error={errors.membershipType?.message}
        >
          <option value="">Select membership...</option>
          <option value="GRAPPLING">Grappling ($220/mo)</option>
          <option value="STRIKING">Striking ($220/mo)</option>
          <option value="BOTH">Both ($275/mo)</option>
          <option value="CHILDREN">Children ($125/mo)</option>
          <option value="FAMILY">Family ($450/mo)</option>
        </Select>

        <Select
          label="Primary Gym"
          {...register("gymId")}
          error={errors.gymId?.message}
        >
          <option value="">Select gym...</option>
          {gyms.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Emergency Contact (optional)"
            {...register("emergencyContact")}
          />
          <Input
            label="Emergency Phone (optional)"
            type="tel"
            {...register("emergencyPhone")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {serverError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>
            Create Student
          </Button>
          <Link
            href="/dashboard/students"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
