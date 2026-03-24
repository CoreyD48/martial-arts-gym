// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "STUDENT") {
    redirect("/portal");
  }

  redirect("/dashboard");
}
