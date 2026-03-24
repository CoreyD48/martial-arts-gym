"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(1, "Zip is required"),
  phone: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function NewGymPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { state: "CO" },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    const res = await fetch("/api/gyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      setServerError(err.error ?? "Failed to create gym");
      return;
    }

    const gym = await res.json();
    router.push(`/dashboard/gyms/${gym.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/gyms" className="hover:text-indigo-600">Gyms</Link>
          <span>/</span>
          <span className="text-gray-900">New Gym</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Gym</h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <Input label="Gym Name" {...register("name")} error={errors.name?.message} />
        <Input label="Address" {...register("address")} error={errors.address?.message} />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input label="City" {...register("city")} error={errors.city?.message} />
          </div>
          <Input label="State" {...register("state")} error={errors.state?.message} />
        </div>
        <Input label="Zip Code" {...register("zip")} error={errors.zip?.message} />
        <Input label="Phone (optional)" type="tel" {...register("phone")} />
        <Input label="Email (optional)" type="email" {...register("email")} error={errors.email?.message} />

        {serverError && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={isSubmitting}>Create Gym</Button>
          <Link href="/dashboard/gyms" className="text-sm text-gray-500 hover:text-gray-700">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
