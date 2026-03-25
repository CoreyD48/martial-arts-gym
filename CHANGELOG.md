# Changelog

## [2026-03-25]

### Fixed
- **`src/lib/prisma.ts`** — Wrapped `createPrismaClient()` in a try-catch that calls `console.error("[prisma] Failed to initialise PrismaClient:", err)` before rethrowing. Added a `console.log` on successful init. Previously, any error thrown during Prisma initialisation (missing `DATABASE_URL`, bad connection string, adapter failure) was swallowed silently, causing the app to return 503s with no log output. The error is still rethrown so request handlers receive it and can return a 500.
- **`src/app/global-error.tsx`** — Created Next.js App Router root error boundary (`global-error.tsx`). Catches any unhandled error that escapes the root layout — including Prisma init failures — logs it via `console.error("[global-error] Unhandled application error:", error)`, and renders a minimal error page with the error message and a "Try again" button. Without this boundary, root-level errors cause a silent 503 with no visible output in Railway's log stream.

## [2026-03-24]

### Fixed
- **`src/app/api/payments/[paymentId]/route.ts`** — Added gym-scoping to PATCH: INSTRUCTORs may only update payments where the payment's `gymId` matches a GymInstructor record for their instructor account; OWNER/ADMIN remain unrestricted.
- **`src/app/api/classes/[classId]/route.ts`** — Added gym-scoping to PATCH: INSTRUCTORs must have a GymInstructor record for the class's `gymId` before updating; returns 404 if class not found during the gym check. OWNER/ADMIN remain unrestricted.
- **`src/app/api/classes/[classId]/sessions/route.ts`** — Added STUDENT role block on GET (students have no access to full session lists). Added gym-scoping to POST: INSTRUCTORs must have a GymInstructor record for the class's `gymId` before creating a session; returns 404 if class not found.
- **`src/app/api/students/[studentId]/route.ts`** — Added gym-scoping to GET: INSTRUCTORs may only view profiles of students who share at least one gym with them via GymStudent/GymInstructor; OWNER/ADMIN and the student themselves remain unrestricted.
- **`src/app/api/instructors/route.ts`** — Added STUDENT role block on GET. STUDENTs have no legitimate need to list all instructors and their email/role data.

## [2026-03-23]

### Fixed
- **`src/app/api/classes/[classId]/sessions/[sessionId]/route.ts`** — Added STUDENT role block on GET. STUDENTs have no access to full session attendance lists; they use their own per-student attendance endpoint.
- **`src/app/api/classes/[classId]/sessions/[sessionId]/attendance/route.ts`** — Added gym-scoping to attendance POST: INSTRUCTORs must have a GymInstructor record for the session's gym; all submitted studentIds are filtered to only those with a GymStudent record for that gym, preventing cross-gym attendance fraud and totalHours inflation.
- **`src/app/api/students/route.ts`** — Added STUDENT role block on GET (students use `/api/students/[studentId]` for their own profile). Added GymInstructor ownership check on POST so INSTRUCTORs can only create students at their assigned gyms.
- **`src/app/api/students/[studentId]/route.ts`** — Added gym-scoping to PATCH: INSTRUCTORs must share at least one gym with the target student via GymStudent/GymInstructor tables; OWNER/ADMIN remain unrestricted.
- **`src/app/api/payments/route.ts`** — Added STUDENT role block on GET. STUDENTs use `/api/students/[studentId]/payments` for their own payment history.

### Added
- **`src/middleware.ts`** — Created Next.js middleware entry point (previously missing; `proxy.ts` was never wired up as middleware). Adds in-memory IP-based rate limiting on `POST /api/auth/callback/credentials`: 5 attempts per 15-minute window, returns HTTP 429 with `Retry-After` header on breach. Delegates route protection (auth + role checks) to `src/proxy.ts`. Includes periodic cleanup of expired rate-limit entries to prevent memory growth.

## [2026-03-21]

### Fixed
- **`src/lib/ranks.ts`**, **`src/app/dashboard/reports/reports-charts.tsx`** — Changed Prisma enum imports from `@/generated/prisma/client` (server-only, uses `node:module`) to `@/generated/prisma/browser` (browser-safe). This resolved a Turbopack build error when the reports page loaded `ReportsCharts` (a `"use client"` component) that transitively imported the Prisma runtime.



### Added
- **`prisma/seed.ts`** — Comprehensive seed file for all application data. Seeds 9 Denver-metro One Way gyms, 1 owner account, 15 instructors distributed across gyms with GymInstructor records, ~120 students across CHILD/TEEN/ADULT age groups with appropriate membership types (GRAPPLING/STRIKING/BOTH/CHILDREN/FAMILY), 8 class templates per gym (72 total), 90 days of past class sessions (~13 per class), attendance at ~70% rate per student with correct countsTowardAdv and hoursLogged, per-student totalHours and lastAttendance updates, rank records tied to training hours, and 6 months of payment history (Oct 2025–Mar 2026) with ON_HOLD students carrying OVERDUE February payments. Clears all data in reverse dependency order before seeding for idempotent runs.

## [2026-03-20]

### Added

- **`src/lib/prisma.ts`** — Singleton PrismaClient importing from `@/generated/prisma` for Next.js HMR safety.
- **`src/lib/auth.ts`** — NextAuth v4 configuration with Credentials provider, JWT strategy, bcryptjs password comparison, and JWT/session callbacks encoding role, studentId, and instructorId.
- **`src/lib/ageGroup.ts`** — `getAgeGroup(dob)` utility using date-fns to classify students as CHILD (<16), TEEN (16-17), or ADULT (18+).
- **`src/lib/ranks.ts`** — Full rank system: MEMBERSHIP_FEES map, CHILD/TEEN/ADULT rank arrays in progression order, `getRankLabel`, `getRankColor`, `isAdvancedRank`, `canAwardRank` (INSTRUCTOR cannot award BLACK+; OWNER/ADMIN can award any), and `getNextRank`.
- **`src/lib/advancement.ts`** — HOURS_TO_ADVANCE constant (2000) and `getHoursProgress` helper.
- **`src/lib/payments.ts`** — `getMembershipFee` and `isBlackBeltRank` utilities.
- **`src/lib/utils.ts`** — `cn` className utility.
- **`src/middleware.ts`** — Route protection for `/dashboard/*` and `/portal/*`; students redirected to /portal, staff to /dashboard, unauthenticated to /login.
- **`src/app/api/auth/[...nextauth]/route.ts`** — NextAuth route handler.
- **`src/app/(auth)/layout.tsx`** — Centered layout for auth pages.
- **`src/app/(auth)/login/page.tsx`** — Login form with react-hook-form + zod validation, role-based redirect after login.
- **`src/components/ui/badge.tsx`** — Pill badge with default/success/warning/danger/info variants.
- **`src/components/ui/button.tsx`** — Button with primary/secondary/ghost/danger variants, sm/md/lg sizes, loading spinner state.
- **`src/components/ui/card.tsx`** — Card, CardHeader, CardTitle, CardContent, CardFooter components.
- **`src/components/ui/input.tsx`** — Input with label, error message, forwarded ref.
- **`src/components/ui/select.tsx`** — Native select with label and error.
- **`src/components/ui/table.tsx`** — Table, TableHeader, TableBody, TableRow, TableHead, TableCell styled components.
- **`src/components/ui/modal.tsx`** — Portal-based modal with keyboard (Escape) dismiss and overlay click dismiss.
- **`src/components/ui/stat-card.tsx`** — KPI stat card with title, value, icon, trend.
- **`src/components/layout/sidebar.tsx`** — Dark sidebar with navigation links, active state, logo, user info, sign out.
- **`src/components/layout/top-nav.tsx`** — Top bar with gym switcher and user role badge.
- **`src/components/layout/gym-switcher.tsx`** — Dropdown that stores selected gym in `selected_gym` cookie.
- **`src/components/students/hold-badge.tsx`** — Red ON HOLD badge for ON_HOLD status.
- **`src/components/students/inactive-badge.tsx`** — Amber INACTIVE 2W+ badge for >14 days since last attendance.
- **`src/components/students/rank-badge.tsx`** — Belt/shirt color swatch + rank label using rank color/label utilities.
- **`src/components/students/rank-progress-bar.tsx`** — Progress bar toward 2000 advancement hours.
- **`src/components/providers.tsx`** — Client-side QueryClientProvider + SessionProvider wrapper.
- **`src/app/layout.tsx`** — Root layout with Providers wrapper, Geist font, Tailwind base styles.
- **`src/app/(dashboard)/layout.tsx`** — Dashboard layout: requires non-STUDENT session, renders Sidebar + TopNav.
- **`src/app/(dashboard)/page.tsx`** — Dashboard home: 4 stat cards + ON_HOLD and Inactive 2W+ alerts.
- **`src/app/api/gyms/route.ts`** — GET list gyms with counts; POST create gym (OWNER/ADMIN only).
- **`src/app/api/gyms/[gymId]/route.ts`** — GET gym detail; PATCH update (OWNER/ADMIN only).
- **`src/app/api/students/route.ts`** — GET list with filters; POST create student+user+gymStudent in transaction.
- **`src/app/api/students/[studentId]/route.ts`** — GET full student profile; PATCH update fields.
- **`src/app/api/students/[studentId]/attendance/route.ts`** — GET paginated attendance history.
- **`src/app/api/students/[studentId]/ranks/route.ts`** — GET current ranks + history; POST award rank with role/hours validation.
- **`src/app/api/students/[studentId]/payments/route.ts`** — GET payment history; POST record payment, auto-lift hold.
- **`src/app/api/instructors/route.ts`** — GET list; POST create instructor+user in transaction.
- **`src/app/api/instructors/[instructorId]/route.ts`** — GET/PATCH instructor.
- **`src/app/api/classes/route.ts`** — GET list with filters; POST create class.
- **`src/app/api/classes/[classId]/route.ts`** — GET/PATCH class.
- **`src/app/api/classes/[classId]/sessions/route.ts`** — GET list sessions; POST create session.
- **`src/app/api/classes/[classId]/sessions/[sessionId]/route.ts`** — GET session with attendance.
- **`src/app/api/classes/[classId]/sessions/[sessionId]/attendance/route.ts`** — POST bulk log attendance, update totalHours and lastAttendance.
- **`src/app/api/payments/route.ts`** — GET list with month/status/gym filters.
- **`src/app/api/payments/billing-run/route.ts`** — POST generate monthly payment records, mark previous PENDING as OVERDUE, set students ON_HOLD.
- **`src/app/api/payments/[paymentId]/route.ts`** — PATCH update payment status, auto-lift hold when paid.
- **`src/app/(dashboard)/gyms/page.tsx`** — Grid of gym cards with student/instructor/today's session counts.
- **`src/app/(dashboard)/gyms/[gymId]/page.tsx`** — Gym detail with classes, student roster, instructors.
- **`src/app/(dashboard)/students/page.tsx`** — Student table with search/filter bar, hold/inactive badges.
- **`src/app/(dashboard)/students/new/page.tsx`** — Create student form.
- **`src/app/(dashboard)/students/[studentId]/page.tsx`** — Student profile with contact info, recent attendance, quick links.
- **`src/app/(dashboard)/students/[studentId]/attendance/page.tsx`** — Full attendance history table.
- **`src/app/(dashboard)/students/[studentId]/ranks/page.tsx`** — Ranks with RankBadge, RankProgressBar, rank history table, award rank modal.
- **`src/app/(dashboard)/students/[studentId]/payments/page.tsx`** — Payment history with record payment modal.
- **`src/app/(dashboard)/instructors/page.tsx`** — Instructor list table.
- **`src/app/(dashboard)/instructors/new/page.tsx`** — Create instructor form with gym assignments.
- **`src/app/(dashboard)/instructors/[instructorId]/page.tsx`** — Instructor profile with gyms and classes.
- **`src/app/(dashboard)/classes/page.tsx`** — Class list with category/style/level/gym filters.
- **`src/app/(dashboard)/classes/new/page.tsx`** — Create class form.
- **`src/app/(dashboard)/classes/[classId]/page.tsx`** — Class detail with sessions list.
- **`src/app/(dashboard)/classes/[classId]/sessions/[sessionId]/page.tsx`** — Interactive attendance sheet for a session.
- **`src/app/(dashboard)/attendance/page.tsx`** — Quick log: select gym → class → create session → check in students.
- **`src/app/(dashboard)/payments/page.tsx`** — Monthly payment table with billing run modal.
- **`src/app/(dashboard)/reports/page.tsx`** — Server component fetching chart data.
- **`src/app/(dashboard)/reports/reports-charts.tsx`** — Recharts: revenue bar chart, attendance line chart, rank distribution pie chart.
- **`src/app/(portal)/layout.tsx`** — Portal layout requiring STUDENT role, simple header with nav and sign out.
- **`src/app/(portal)/page.tsx`** — Student dashboard: stats, rank display, advancement progress, upcoming classes.
- **`src/app/(portal)/attendance/page.tsx`** — Student's attendance history table.
- **`src/app/(portal)/ranks/page.tsx`** — Student's ranks with RankBadge, RankProgressBar, and history.
- **`src/app/(portal)/payments/page.tsx`** — Student's payment history with outstanding balance alert.
- **`src/app/page.tsx`** — Root redirect: unauthenticated → /login, STUDENT → /portal, staff → /dashboard.
