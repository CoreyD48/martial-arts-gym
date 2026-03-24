"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Gym {
  id: string;
  name: string;
}

export function GymSwitcher() {
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string>("");

  useEffect(() => {
    // Read selected gym from cookie
    const match = document.cookie.match(/(?:^|;\s*)selected_gym=([^;]*)/);
    if (match) setSelectedGymId(decodeURIComponent(match[1]));

    fetch("/api/gyms")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setGyms(data);
        else if (Array.isArray(data.gyms)) setGyms(data.gyms);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedGymId(val);
    document.cookie = `selected_gym=${encodeURIComponent(val)}; path=/; max-age=86400`;
    router.refresh();
  };

  return (
    <select
      value={selectedGymId}
      onChange={handleChange}
      className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    >
      <option value="">All Gyms</option>
      {gyms.map((gym) => (
        <option key={gym.id} value={gym.id}>
          {gym.name}
        </option>
      ))}
    </select>
  );
}
