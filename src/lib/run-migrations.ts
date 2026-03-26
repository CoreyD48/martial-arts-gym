// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.
//
// This module runs `prisma migrate deploy` and `prisma db seed` at app startup
// so that migrations are applied when DATABASE_URL is available (i.e. at runtime),
// not during the build/pre-deploy phase where env vars are absent.
//
// Errors are logged but NOT rethrown — a migration failure must not prevent the
// app from starting, so the process continues and serves requests normally.

import { execSync } from "child_process";

let migrationRan = false;

export async function runMigrations(): Promise<void> {
  // Guard: only run once per process lifetime (Next.js may call the root layout
  // multiple times during startup in development with HMR).
  if (migrationRan) return;
  migrationRan = true;

  if (!process.env.DATABASE_URL) {
    console.warn("[migrations] DATABASE_URL is not set — skipping migrate deploy and seed");
    return;
  }

  // Run `prisma migrate deploy`
  try {
    console.log("[migrations] Running prisma migrate deploy…");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env,
    });
    console.log("[migrations] prisma migrate deploy completed successfully");
  } catch (err) {
    console.error("[migrations] prisma migrate deploy failed:", err);
    // Do not rethrow — allow the app to continue starting up.
  }

  // Run `prisma db seed`
  try {
    console.log("[migrations] Running prisma db seed…");
    execSync("npx prisma db seed", {
      stdio: "inherit",
      env: process.env,
    });
    console.log("[migrations] prisma db seed completed successfully");
  } catch (err) {
    console.error("[migrations] prisma db seed failed:", err);
    // Do not rethrow — allow the app to continue starting up.
  }
}
