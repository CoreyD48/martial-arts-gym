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
import { Button } from "@/components/ui/button";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Gym {
  id: string;
  name: string;
}

export default function NewInstructorPage() {
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGymIds, setSelectedGymIds] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    fetch("/api/gyms")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGyms(data);
      });
  }, []);

  const toggleGym = (gymId: string) => {
    setSelectedGymIds((prev) =>
      prev.includes(gymId) ? prev.filter((id) => id !== gymId) : [...prev, gymId]
    );
  };

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const res = await fetch("/api/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, gymIds: selectedGymIds }),
    });

    if (!res.ok) {
      const err = await res.json();
      setServerError(err.error ?? "Failed to create instructor");
      return;
    }

    const instructor = await res.json();
    router.push(`/dashboard/instructors/${instructor.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/instructors" className="hover:text-indigo-600">
            Instructors
          </Link>
          <span>/</span>
          <span className="text-gray-900">New Instructor</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Instructor</h1>
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
          label="Phone (optional)"
          type="tel"
          {...register("phone")}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio (optional)
          </label>
          <textarea
            {...register("bio")}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assigned Gyms
          </label>
          <div className="space-y-2">
            {gyms.map((gym) => (
              <label key={gym.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGymIds.includes(gym.id)}
                  onChange={() => toggleGym(gym.id)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{gym.name}</span>
              </label>
            ))}
          </div>
        </div>

        {serverError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>
            Create Instructor
          </Button>
          <Link
            href="/dashboard/instructors"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
