// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.
//
// global-error.tsx is the Next.js App Router root error boundary. It catches any
// unhandled error that escapes the root layout — including Prisma initialisation
// failures — and logs the full error to the server console so it appears in the
// Railway log stream. Without this boundary those errors cause a silent 503.
//
// This component MUST be a Client Component and MUST render its own <html>/<body>
// because it replaces the root layout when active.

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the server-side console via the browser's error reporting so the
    // full stack trace is visible in Railway's log stream.
    console.error("[global-error] Unhandled application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          backgroundColor: "#f9fafb",
          color: "#111827",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem", maxWidth: 480, textAlign: "center" }}>
          The application encountered an unexpected error on startup. Check the
          server logs for the full error message.
        </p>
        {error?.message && (
          <pre
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "1rem",
              borderRadius: "0.375rem",
              maxWidth: 600,
              overflowX: "auto",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
