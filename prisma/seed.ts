// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function getAgeGroup(dob: Date, referenceDate = new Date()): "CHILD" | "TEEN" | "ADULT" {
  const ageMsec = referenceDate.getTime() - dob.getTime();
  const ageYears = ageMsec / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 16) return "CHILD";
  if (ageYears < 18) return "TEEN";
  return "ADULT";
}

/** Return all past dates in the last N days that fall on a given dayOfWeek (0=Sun, 1=Mon … 6=Sat). */
function pastDatesForDayOfWeek(dayOfWeek: number, daysBack: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  for (let i = 1; i <= daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() === dayOfWeek) {
      dates.push(d);
    }
  }
  return dates;
}

/** Deterministic pseudo-random seeded by a string — avoids fully random data across reruns. */
function seededRandom(seed: string, index = 0): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length + index; i++) {
    h ^= seed.charCodeAt(i % seed.length) + index;
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 0xffffffff);
}

// ─── Data Definitions ────────────────────────────────────────────────────────

const GYMS = [
  { name: "One Way LoDo",            address: "1234 Blake St",           city: "Denver",          zip: "80202", email: "lodo@oneway.gym",            phone: "303-555-0101" },
  { name: "One Way Cherry Creek",    address: "2500 E 3rd Ave",          city: "Denver",          zip: "80206", email: "cherrycreek@oneway.gym",     phone: "303-555-0102" },
  { name: "One Way Highlands Ranch", address: "9300 S Ridgeline Blvd",   city: "Highlands Ranch", zip: "80129", email: "highlandsranch@oneway.gym",  phone: "303-555-0103" },
  { name: "One Way Aurora",          address: "14300 E Alameda Ave",     city: "Aurora",          zip: "80012", email: "aurora@oneway.gym",          phone: "303-555-0104" },
  { name: "One Way Lakewood",        address: "7000 W Colfax Ave",       city: "Lakewood",        zip: "80214", email: "lakewood@oneway.gym",        phone: "303-555-0105" },
  { name: "One Way Englewood",       address: "3400 S Broadway",         city: "Englewood",       zip: "80113", email: "englewood@oneway.gym",       phone: "303-555-0106" },
  { name: "One Way Thornton",        address: "9901 Grant St",           city: "Thornton",        zip: "80229", email: "thornton@oneway.gym",        phone: "303-555-0107" },
  { name: "One Way Westminster",     address: "8800 Sheridan Blvd",      city: "Westminster",     zip: "80003", email: "westminster@oneway.gym",     phone: "303-555-0108" },
  { name: "One Way Centennial",      address: "7500 E Arapahoe Rd",      city: "Centennial",      zip: "80112", email: "centennial@oneway.gym",      phone: "303-555-0109" },
];

const INSTRUCTOR_NAMES = [
  { first: "Carlos",  last: "Mendes"    },
  { first: "Sarah",   last: "Kim"       },
  { first: "Jake",    last: "Torres"    },
  { first: "Maria",   last: "Santos"    },
  { first: "David",   last: "Chen"      },
  { first: "Aisha",   last: "Johnson"   },
  { first: "Miguel",  last: "Rodriguez" },
  { first: "Emma",    last: "Walsh"     },
  { first: "Tyler",   last: "Brooks"    },
  { first: "Yuki",    last: "Tanaka"    },
  { first: "Brandon", last: "Lee"       },
  { first: "Sofia",   last: "Martinez"  },
  { first: "Ryan",    last: "OBrien"    },
  { first: "Priya",   last: "Patel"     },
  { first: "Marcus",  last: "Williams"  },
];

// Each instructor: [primaryGymIndex, ...additionalGymIndexes]
// 15 instructors across 9 gyms — each gym gets at least one primary
const INSTRUCTOR_GYMS: number[][] = [
  [0],        // Carlos  — LoDo
  [1],        // Sarah   — Cherry Creek
  [2],        // Jake    — Highlands Ranch
  [3],        // Maria   — Aurora
  [4],        // David   — Lakewood
  [5],        // Aisha   — Englewood
  [6],        // Miguel  — Thornton
  [7],        // Emma    — Westminster
  [8],        // Tyler   — Centennial
  [0, 1],     // Yuki    — LoDo + Cherry Creek
  [2, 3],     // Brandon — Highlands Ranch + Aurora
  [4, 5],     // Sofia   — Lakewood + Englewood
  [6, 7],     // Ryan    — Thornton + Westminster
  [8, 0],     // Priya   — Centennial + LoDo
  [1, 2, 3],  // Marcus  — Cherry Creek + Highlands Ranch + Aurora
];

// Classes template — created for each gym
const CLASS_TEMPLATES = [
  {
    name: "Family BJJ",
    category: "FAMILY" as const,
    grapplingStyle: "JIU_JITSU_GI" as const,
    strikingStyle: null,
    skillLevel: "BEGINNER" as const,
    ageGroup: null,
    dayOfWeek: 6,
    startTime: "09:00",
    durationMinutes: 60,
    countsTowardAdvancement: false,
  },
  {
    name: "Adult BJJ Gi Beginner",
    category: "GRAPPLING" as const,
    grapplingStyle: "JIU_JITSU_GI" as const,
    strikingStyle: null,
    skillLevel: "BEGINNER" as const,
    ageGroup: "ADULT" as const,
    dayOfWeek: 1,
    startTime: "18:00",
    durationMinutes: 90,
    countsTowardAdvancement: true,
  },
  {
    name: "Adult BJJ Gi Advanced",
    category: "GRAPPLING" as const,
    grapplingStyle: "JIU_JITSU_GI" as const,
    strikingStyle: null,
    skillLevel: "ADVANCED" as const,
    ageGroup: "ADULT" as const,
    dayOfWeek: 3,
    startTime: "18:00",
    durationMinutes: 90,
    countsTowardAdvancement: true,
  },
  {
    name: "Kids BJJ",
    category: "GRAPPLING" as const,
    grapplingStyle: "JIU_JITSU_GI" as const,
    strikingStyle: null,
    skillLevel: "BEGINNER" as const,
    ageGroup: "CHILD" as const,
    dayOfWeek: 2,
    startTime: "16:00",
    durationMinutes: 60,
    countsTowardAdvancement: true,
  },
  {
    name: "Wrestling",
    category: "GRAPPLING" as const,
    grapplingStyle: "WRESTLING" as const,
    strikingStyle: null,
    skillLevel: "INTERMEDIATE" as const,
    ageGroup: "ADULT" as const,
    dayOfWeek: 4,
    startTime: "18:30",
    durationMinutes: 90,
    countsTowardAdvancement: true,
  },
  {
    name: "Muay Thai Beginner",
    category: "STRIKING" as const,
    grapplingStyle: null,
    strikingStyle: "MUAY_THAI" as const,
    skillLevel: "BEGINNER" as const,
    ageGroup: "ADULT" as const,
    dayOfWeek: 2,
    startTime: "19:00",
    durationMinutes: 60,
    countsTowardAdvancement: true,
  },
  {
    name: "Kickboxing",
    category: "STRIKING" as const,
    grapplingStyle: null,
    strikingStyle: "KICKBOXING" as const,
    skillLevel: "BEGINNER" as const,
    ageGroup: "ADULT" as const,
    dayOfWeek: 5,
    startTime: "18:00",
    durationMinutes: 60,
    countsTowardAdvancement: true,
  },
  {
    name: "Boxing",
    category: "STRIKING" as const,
    grapplingStyle: null,
    strikingStyle: "BOXING" as const,
    skillLevel: "BEGINNER" as const,
    ageGroup: "ADULT" as const,
    dayOfWeek: 1,
    startTime: "07:00",
    durationMinutes: 60,
    countsTowardAdvancement: true,
  },
];

// ─── Student name pool ───────────────────────────────────────────────────────

const FIRST_NAMES_ADULTS = [
  "James", "Olivia", "Liam", "Emma", "Noah", "Ava", "William", "Sophia",
  "Benjamin", "Isabella", "Lucas", "Mia", "Henry", "Charlotte", "Alexander",
  "Amelia", "Mason", "Harper", "Ethan", "Evelyn", "Daniel", "Abigail",
  "Michael", "Emily", "Jackson", "Elizabeth", "Sebastian", "Mila", "Jack",
  "Ella", "Owen", "Avery", "Samuel", "Sofia", "Wyatt", "Camila",
  "John", "Aria", "David", "Scarlett", "Leo", "Victoria", "Luke",
  "Madison", "Julian", "Luna", "Levi", "Grace", "Isaac", "Chloe",
];

const FIRST_NAMES_KIDS = [
  "Aiden", "Zoe", "Caleb", "Lily", "Elijah", "Nora", "Nathan", "Hannah",
  "Ryan", "Layla", "Logan", "Stella", "Dylan", "Violet", "Hunter",
  "Aurora", "Eli", "Savannah", "Connor", "Paisley", "Jaxon", "Ellie",
  "Cooper", "Bella", "Brayden", "Claire", "Grayson", "Skylar", "Miles",
  "Aubrey", "Asher", "Aaliyah", "Colton", "Lucy", "Dominic", "Anna",
  "Lincoln", "Samantha", "Jordan", "Maya",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
  "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
  "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
  "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
  "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts",
];

// ─── Build student data ──────────────────────────────────────────────────────

interface StudentDef {
  firstName: string;
  lastName: string;
  email: string;
  dob: Date;
  ageGroup: "CHILD" | "TEEN" | "ADULT";
  membershipType: "GRAPPLING" | "STRIKING" | "BOTH" | "CHILDREN" | "FAMILY";
  accountStatus: "ACTIVE" | "ON_HOLD" | "INACTIVE";
  primaryGymIndex: number;
  secondaryGymIndex: number | null;
  phone: string;
}

function buildStudents(): StudentDef[] {
  const students: StudentDef[] = [];

  // Helper: produce a DOB for a given age range (in years)
  function dobForAge(minAge: number, maxAge: number, seed: string): Date {
    const r = seededRandom(seed);
    const ageYears = minAge + r * (maxAge - minAge);
    const d = new Date(2026, 2, 21); // reference date = 2026-03-21
    d.setFullYear(d.getFullYear() - Math.floor(ageYears));
    d.setMonth(Math.floor(seededRandom(seed + "m") * 12));
    d.setDate(1 + Math.floor(seededRandom(seed + "d") * 28));
    return d;
  }

  function phone(seed: string): string {
    const n = (s: string, o: number) => Math.floor(seededRandom(s, o) * 9 + 1);
    return `${n(seed,0)}${n(seed,1)}${n(seed,2)}-${n(seed,3)}${n(seed,4)}${n(seed,5)}-${n(seed,6)}${n(seed,7)}${n(seed,8)}${n(seed,9)}`;
  }

  let idx = 0;

  function addStudent(
    firstName: string,
    lastName: string,
    dobMinAge: number,
    dobMaxAge: number,
    membershipType: StudentDef["membershipType"],
    accountStatus: StudentDef["accountStatus"],
    primaryGymIndex: number,
    secondaryGymIndex: number | null,
  ) {
    const emailNum = idx + 1;
    const seed = `${firstName}${lastName}${emailNum}`;
    const dob = dobForAge(dobMinAge, dobMaxAge, seed);
    const ag = getAgeGroup(dob, new Date(2026, 2, 21));
    students.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailNum}@gmail.com`,
      dob,
      ageGroup: ag,
      membershipType,
      accountStatus,
      primaryGymIndex,
      secondaryGymIndex,
      phone: phone(seed),
    });
    idx++;
  }

  const adultFirstNames = FIRST_NAMES_ADULTS;
  const kidsFirstNames = FIRST_NAMES_KIDS;
  const lastNames = LAST_NAMES;

  // 50 adults (18-45): split across GRAPPLING, STRIKING, BOTH
  const adultMemberships: StudentDef["membershipType"][] = ["GRAPPLING", "STRIKING", "BOTH"];
  for (let i = 0; i < 50; i++) {
    const fn = adultFirstNames[i % adultFirstNames.length];
    const ln = lastNames[i % lastNames.length];
    const gym = i % 9;
    const secondGym = i % 5 === 0 ? (gym + 1) % 9 : null; // every 5th gets a second gym
    const membership = adultMemberships[i % 3];
    // 90% ACTIVE, 8% ON_HOLD, 2% INACTIVE
    const status: StudentDef["accountStatus"] =
      i < 45 ? "ACTIVE" : i < 49 ? "ON_HOLD" : "INACTIVE";
    addStudent(fn, ln, 18, 45, membership, status, gym, secondGym);
  }

  // 40 children (6-15): CHILDREN membership
  for (let i = 0; i < 40; i++) {
    const fn = kidsFirstNames[i % kidsFirstNames.length];
    const ln = lastNames[(i + 10) % lastNames.length];
    const gym = i % 9;
    const secondGym = i % 8 === 0 ? (gym + 2) % 9 : null;
    const status: StudentDef["accountStatus"] =
      i < 36 ? "ACTIVE" : i < 39 ? "ON_HOLD" : "INACTIVE";
    addStudent(fn, ln, 6, 15, "CHILDREN", status, gym, secondGym);
  }

  // 15 teens (16-17): split between GRAPPLING and STRIKING
  const teenMemberships: StudentDef["membershipType"][] = ["GRAPPLING", "STRIKING"];
  for (let i = 0; i < 15; i++) {
    const fn = adultFirstNames[(i + 20) % adultFirstNames.length];
    const ln = lastNames[(i + 25) % lastNames.length];
    const gym = i % 9;
    const membership = teenMemberships[i % 2];
    const status: StudentDef["accountStatus"] = i < 14 ? "ACTIVE" : "ON_HOLD";
    addStudent(fn, ln, 16, 17, membership, status, gym, null);
  }

  // 15 family memberships (adults with FAMILY membership)
  for (let i = 0; i < 15; i++) {
    const fn = adultFirstNames[(i + 5) % adultFirstNames.length];
    const ln = lastNames[(i + 35) % lastNames.length];
    const gym = i % 9;
    const secondGym = i % 3 === 0 ? (gym + 3) % 9 : null;
    const status: StudentDef["accountStatus"] = i < 13 ? "ACTIVE" : "ON_HOLD";
    addStudent(fn, ln, 25, 45, "FAMILY", status, gym, secondGym);
  }

  return students;
}

// ─── Membership pricing ──────────────────────────────────────────────────────

const MEMBERSHIP_PRICE: Record<string, number> = {
  GRAPPLING: 220,
  STRIKING: 220,
  BOTH: 275,
  CHILDREN: 125,
  FAMILY: 450,
};

// ─── Main Seed ───────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting seed — clearing existing data...");

  // Delete in reverse dependency order
  await prisma.attendance.deleteMany();
  await prisma.rankHistory.deleteMany();
  await prisma.studentRank.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.class.deleteMany();
  await prisma.gymStudent.deleteMany();
  await prisma.gymInstructor.deleteMany();
  await prisma.student.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.user.deleteMany();

  console.log("All existing data cleared.");

  // ─── 1. Gyms ─────────────────────────────────────────────────────────────

  console.log("Creating gyms...");
  const gyms = await Promise.all(
    GYMS.map((g) =>
      prisma.gym.create({
        data: {
          name: g.name,
          address: g.address,
          city: g.city,
          state: "CO",
          zip: g.zip,
          phone: g.phone,
          email: g.email,
          isActive: true,
        },
      })
    )
  );
  console.log(`  Created ${gyms.length} gyms.`);

  // ─── 2. Owner ─────────────────────────────────────────────────────────────

  console.log("Creating owner...");
  await prisma.user.create({
    data: {
      email: "owner@oneway.gym",
      passwordHash: hashPassword("OneWay2024!"),
      role: "OWNER",
    },
  });
  console.log("  Owner created.");

  // ─── 3. Instructors ───────────────────────────────────────────────────────

  console.log("Creating instructors...");
  const instructorRecords: Array<{
    id: string;
    primaryGymIndex: number;
    gymIndexes: number[];
  }> = [];

  for (let i = 0; i < INSTRUCTOR_NAMES.length; i++) {
    const { first, last } = INSTRUCTOR_NAMES[i];
    const gymIndexes = INSTRUCTOR_GYMS[i];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@oneway.gym`;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword("Instructor123!"),
        role: "INSTRUCTOR",
      },
    });

    const instructor = await prisma.instructor.create({
      data: {
        userId: user.id,
        firstName: first,
        lastName: last,
        phone: `303-555-${String(200 + i).padStart(4, "0")}`,
        bio: `${first} ${last} is a dedicated martial arts instructor at One Way gym.`,
      },
    });

    for (let j = 0; j < gymIndexes.length; j++) {
      await prisma.gymInstructor.create({
        data: {
          instructorId: instructor.id,
          gymId: gyms[gymIndexes[j]].id,
          isPrimary: j === 0,
        },
      });
    }

    instructorRecords.push({
      id: instructor.id,
      primaryGymIndex: gymIndexes[0],
      gymIndexes,
    });
  }
  console.log(`  Created ${instructorRecords.length} instructors.`);

  // Map: gymIndex -> primary instructor id for that gym
  // We need the first instructor whose primary gym is gymIndex
  const gymPrimaryInstructor: Map<number, string> = new Map();
  for (const rec of instructorRecords) {
    if (!gymPrimaryInstructor.has(rec.primaryGymIndex)) {
      gymPrimaryInstructor.set(rec.primaryGymIndex, rec.id);
    }
  }

  // ─── 4. Classes ───────────────────────────────────────────────────────────

  console.log("Creating classes...");
  // classMap[gymIndex][templateIndex] = Class record
  const classMap: Map<number, Array<{ id: string; durationMinutes: number; countsTowardAdvancement: boolean; dayOfWeek: number; category: string; ageGroup: string | null }>> = new Map();

  for (let gi = 0; gi < gyms.length; gi++) {
    const gymClasses = [];
    const primaryInstructorId = gymPrimaryInstructor.get(gi) ?? null;

    for (const tmpl of CLASS_TEMPLATES) {
      const cls = await prisma.class.create({
        data: {
          gymId: gyms[gi].id,
          instructorId: primaryInstructorId,
          name: tmpl.name,
          category: tmpl.category,
          grapplingStyle: tmpl.grapplingStyle ?? undefined,
          strikingStyle: tmpl.strikingStyle ?? undefined,
          skillLevel: tmpl.skillLevel,
          ageGroup: tmpl.ageGroup ?? undefined,
          dayOfWeek: tmpl.dayOfWeek,
          startTime: tmpl.startTime,
          durationMinutes: tmpl.durationMinutes,
          countsTowardAdvancement: tmpl.countsTowardAdvancement,
          isActive: true,
        },
      });
      gymClasses.push({
        id: cls.id,
        durationMinutes: cls.durationMinutes,
        countsTowardAdvancement: cls.countsTowardAdvancement,
        dayOfWeek: cls.dayOfWeek,
        category: cls.category,
        ageGroup: cls.ageGroup ?? null,
      });
    }
    classMap.set(gi, gymClasses);
  }

  const totalClasses = gyms.length * CLASS_TEMPLATES.length;
  console.log(`  Created ${totalClasses} classes (${CLASS_TEMPLATES.length} per gym).`);

  // ─── 5. Class Sessions — 90 days back ─────────────────────────────────────

  console.log("Creating class sessions...");
  // sessionMap[classId] = ClassSession[]
  const sessionMap: Map<string, Array<{ id: string; sessionDate: Date; classId: string }>> = new Map();

  let totalSessions = 0;
  for (const [, classes] of Array.from(classMap.entries())) {
    for (const cls of classes) {
      const dates = pastDatesForDayOfWeek(cls.dayOfWeek, 90);
      const sessions = [];
      for (const date of dates) {
        const session = await prisma.classSession.create({
          data: {
            classId: cls.id,
            sessionDate: date,
          },
        });
        sessions.push({ id: session.id, sessionDate: date, classId: cls.id });
        totalSessions++;
      }
      sessionMap.set(cls.id, sessions);
    }
  }
  console.log(`  Created ${totalSessions} sessions.`);

  // ─── 6. Students ──────────────────────────────────────────────────────────

  console.log("Creating students...");
  const studentDefs = buildStudents();

  interface CreatedStudent {
    id: string;
    def: StudentDef;
  }
  const createdStudents: CreatedStudent[] = [];

  for (const def of studentDefs) {
    const user = await prisma.user.create({
      data: {
        email: def.email,
        passwordHash: hashPassword("Student123!"),
        role: "STUDENT",
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        firstName: def.firstName,
        lastName: def.lastName,
        dateOfBirth: def.dob,
        ageGroup: def.ageGroup,
        phone: def.phone,
        membershipType: def.membershipType,
        accountStatus: def.accountStatus,
        totalHours: 0,
      },
    });

    // Primary gym
    await prisma.gymStudent.create({
      data: {
        studentId: student.id,
        gymId: gyms[def.primaryGymIndex].id,
        isPrimary: true,
      },
    });

    // Secondary gym (if any)
    if (def.secondaryGymIndex !== null) {
      await prisma.gymStudent.create({
        data: {
          studentId: student.id,
          gymId: gyms[def.secondaryGymIndex].id,
          isPrimary: false,
        },
      });
    }

    createdStudents.push({ id: student.id, def });
  }
  console.log(`  Created ${createdStudents.length} students.`);

  // ─── 7. Attendance ────────────────────────────────────────────────────────

  console.log("Creating attendance records...");

  // Students who should have no/stale attendance — pick ~10 to skip or have old attendance
  const staleStudentIds = new Set(
    createdStudents.slice(0, 10).map((s) => s.id)
  );

  // Track hours and last attendance per student
  const studentHours: Map<string, number> = new Map();
  const studentLastAtt: Map<string, Date> = new Map();

  for (const s of createdStudents) {
    studentHours.set(s.id, 0);
  }

  // For each student, attend ~70% of their primary gym's sessions
  let totalAttendance = 0;

  for (const s of createdStudents) {
    if (s.def.accountStatus === "INACTIVE") continue;
    if (staleStudentIds.has(s.id)) continue; // skip — these will have no attendance

    const gymIdx = s.def.primaryGymIndex;
    const gymClasses = classMap.get(gymIdx) ?? [];
    const seed = s.def.email;
    let latestDate: Date | null = null;

    for (let ci = 0; ci < gymClasses.length; ci++) {
      const cls = gymClasses[ci];
      const sessions = sessionMap.get(cls.id) ?? [];

      // Skip classes not appropriate for this student's age group
      if (cls.ageGroup !== null) {
        if (cls.ageGroup === "CHILD" && s.def.ageGroup !== "CHILD") continue;
        if (cls.ageGroup === "ADULT" && s.def.ageGroup === "CHILD") continue;
        // TEEN can attend ADULT classes
      }

      // Skip grappling/striking classes based on membership type
      if (s.def.membershipType !== "FAMILY" && s.def.membershipType !== "BOTH") {
        if (s.def.membershipType === "CHILDREN") {
          // Children attend FAMILY and GRAPPLING (kids bjj) and not striking adult
          if (cls.category === "STRIKING") continue;
        } else if (s.def.membershipType === "GRAPPLING") {
          if (cls.category === "STRIKING") continue;
        } else if (s.def.membershipType === "STRIKING") {
          if (cls.category === "GRAPPLING") continue;
          if (cls.category === "FAMILY") continue;
        }
      }

      const hoursLogged = cls.countsTowardAdvancement
        ? cls.durationMinutes / 60
        : 1.0;

      for (let si = 0; si < sessions.length; si++) {
        const session = sessions[si];
        // 70% attendance rate — skip ~30% using seeded random
        if (seededRandom(seed, ci * 1000 + si) > 0.70) continue;

        // Family class: slightly less attendance
        if (cls.category === "FAMILY" && seededRandom(seed + "fam", si) > 0.50) continue;

        try {
          await prisma.attendance.create({
            data: {
              studentId: s.id,
              sessionId: session.id,
              checkedInAt: session.sessionDate,
              hoursLogged: hoursLogged,
              countsTowardAdv: cls.countsTowardAdvancement,
            },
          });
          totalAttendance++;

          if (cls.countsTowardAdvancement) {
            studentHours.set(s.id, (studentHours.get(s.id) ?? 0) + hoursLogged);
          }

          if (latestDate === null || session.sessionDate > latestDate) {
            latestDate = session.sessionDate;
          }
        } catch {
          // Skip duplicate attendance records (shouldn't happen but guard anyway)
        }
      }
    }

    if (latestDate) {
      studentLastAtt.set(s.id, latestDate);
    }
  }

  // For the 10 stale students — give them one old attendance (>14 days ago) or none at all
  // First 5 get no attendance; next 5 get attendance that's older than 14 days
  const staleArray = Array.from(staleStudentIds);
  for (let i = 5; i < 10; i++) {
    const sid = staleArray[i];
    const s = createdStudents.find((c) => c.id === sid);
    if (!s) continue;
    const gymIdx = s.def.primaryGymIndex;
    const gymClasses = classMap.get(gymIdx) ?? [];
    if (gymClasses.length === 0) continue;

    // Find a session from >14 days ago
    const cls = gymClasses[1]; // Adult BJJ Gi Beginner
    if (!cls) continue;
    const sessions = sessionMap.get(cls.id) ?? [];
    const cutoff = new Date(2026, 2, 21);
    cutoff.setDate(cutoff.getDate() - 20);
    const oldSessions = sessions.filter((s) => s.sessionDate < cutoff);
    if (oldSessions.length === 0) continue;

    const session = oldSessions[0];
    try {
      await prisma.attendance.create({
        data: {
          studentId: sid,
          sessionId: session.id,
          checkedInAt: session.sessionDate,
          hoursLogged: cls.durationMinutes / 60,
          countsTowardAdv: cls.countsTowardAdvancement,
        },
      });
      totalAttendance++;
      studentHours.set(sid, (studentHours.get(sid) ?? 0) + cls.durationMinutes / 60);
      studentLastAtt.set(sid, session.sessionDate);
    } catch {
      // ignore
    }
  }

  console.log(`  Created ${totalAttendance} attendance records.`);

  // ─── 8. Update student totalHours + lastAttendance ────────────────────────

  console.log("Updating student hour totals...");
  for (const s of createdStudents) {
    const hours = studentHours.get(s.id) ?? 0;
    const lastAtt = studentLastAtt.get(s.id) ?? null;
    await prisma.student.update({
      where: { id: s.id },
      data: {
        totalHours: hours,
        lastAttendance: lastAtt,
      },
    });
  }
  console.log("  Student hours updated.");

  // ─── 9. Ranks ─────────────────────────────────────────────────────────────

  console.log("Creating ranks...");

  const adultRankProgression: string[] = ["WHITE", "BLUE", "PURPLE"];
  const childRankProgression: string[] = [
    "WHITE", "WHITE_WHITE", "GREY", "GREY_BLACK", "YELLOW_WHITE",
    "YELLOW", "YELLOW_BLACK", "ORANGE_WHITE", "ORANGE", "ORANGE_BLACK",
  ];
  const teenRankProgression: string[] = ["PURPLE", "BROWN"];

  let totalRanks = 0;

  for (const s of createdStudents) {
    if (s.def.accountStatus === "INACTIVE") continue;

    const hours = studentHours.get(s.id) ?? 0;
    const ag = s.def.ageGroup;
    const seed = s.id + "rank";

    // Determine rank based on hours and age group
    let adultRank: string | null = null;
    let childRank: string | null = null;
    let teenRank: string | null = null;

    if (ag === "ADULT") {
      // Hours thresholds: <20h = WHITE, 20-80h = BLUE, >80h = PURPLE
      if (hours < 20) {
        adultRank = "WHITE";
      } else if (hours < 80) {
        adultRank = "BLUE";
      } else {
        // Mix of BLUE and PURPLE for high-hour students
        adultRank = seededRandom(seed) > 0.4 ? "PURPLE" : "BLUE";
      }
    } else if (ag === "CHILD") {
      // Progress through child ranks based on hours
      const rankIdx = Math.min(
        Math.floor(hours / 8),
        childRankProgression.length - 1
      );
      childRank = childRankProgression[rankIdx];
    } else if (ag === "TEEN") {
      teenRank = hours > 40 ? "BROWN" : "PURPLE";
    }

    // Grappling rank (BJJ Gi) for grappling members
    if (
      s.def.membershipType === "GRAPPLING" ||
      s.def.membershipType === "BOTH" ||
      s.def.membershipType === "CHILDREN" ||
      s.def.membershipType === "FAMILY"
    ) {
      try {
        await prisma.studentRank.create({
          data: {
            studentId: s.id,
            category: "GRAPPLING",
            grapplingStyle: "JIU_JITSU_GI",
            ageGroup: ag,
            adultRank: ag === "ADULT" ? (adultRank as any) : undefined,
            childRank: ag === "CHILD" ? (childRank as any) : undefined,
            teenRank: ag === "TEEN" ? (teenRank as any) : undefined,
            awardedAt: new Date(2025, 9, 1), // Oct 2025
          },
        });
        totalRanks++;
      } catch {
        // skip
      }
    }

    // Striking rank for striking members
    if (s.def.membershipType === "STRIKING" || s.def.membershipType === "BOTH") {
      // Use Muay Thai as primary striking rank
      const strikingAdultRank = adultRank ?? "WHITE";
      try {
        await prisma.studentRank.create({
          data: {
            studentId: s.id,
            category: "STRIKING",
            strikingStyle: "MUAY_THAI",
            ageGroup: ag,
            adultRank: ag === "ADULT" ? (strikingAdultRank as any) : undefined,
            childRank: ag === "CHILD" ? (childRank as any) : undefined,
            teenRank: ag === "TEEN" ? (teenRank as any) : undefined,
            awardedAt: new Date(2025, 9, 1),
          },
        });
        totalRanks++;
      } catch {
        // skip
      }
    }
  }
  console.log(`  Created ${totalRanks} rank records.`);

  // ─── 10. Payments — 6 months Oct 2025 – Mar 2026 ─────────────────────────

  console.log("Creating payments...");

  // billingMonths as first of each month
  const billingMonths = [
    new Date(2025, 9, 1),  // Oct 2025
    new Date(2025, 10, 1), // Nov 2025
    new Date(2025, 11, 1), // Dec 2025
    new Date(2026, 0, 1),  // Jan 2026
    new Date(2026, 1, 1),  // Feb 2026
    new Date(2026, 2, 1),  // Mar 2026
  ];

  let totalPayments = 0;

  for (const s of createdStudents) {
    if (s.def.accountStatus === "INACTIVE") continue;

    const amountDue = MEMBERSHIP_PRICE[s.def.membershipType];
    const gymId = gyms[s.def.primaryGymIndex].id;
    const seed = s.id + "pay";

    for (let mi = 0; mi < billingMonths.length; mi++) {
      const month = billingMonths[mi];
      let status: "PAID" | "OVERDUE" | "PENDING" | "WAIVED";
      let amountPaid = 0;
      let paidAt: Date | null = null;

      if (mi < 4) {
        // Oct–Jan: all PAID
        status = "PAID";
        amountPaid = amountDue;
        paidAt = new Date(month.getFullYear(), month.getMonth(), 5);
      } else if (mi === 4) {
        // Feb 2026
        if (s.def.accountStatus === "ON_HOLD") {
          // ON_HOLD students must be OVERDUE in Feb — this drives the ON_HOLD status
          status = "OVERDUE";
          amountPaid = 0;
          paidAt = null;
        } else {
          // 90% PAID, 2% WAIVED for remaining active
          const r = seededRandom(seed, mi);
          if (r < 0.02) {
            status = "WAIVED";
            amountPaid = 0;
          } else {
            status = "PAID";
            amountPaid = amountDue;
            paidAt = new Date(2026, 1, 5);
          }
        }
      } else {
        // Mar 2026: all PENDING
        status = "PENDING";
        amountPaid = 0;
        paidAt = null;
      }

      try {
        await prisma.payment.create({
          data: {
            studentId: s.id,
            gymId,
            billingMonth: month,
            membershipType: s.def.membershipType,
            amountDue,
            amountPaid,
            status,
            paidAt,
          },
        });
        totalPayments++;
      } catch {
        // skip duplicate billing months (shouldn't happen)
      }
    }
  }
  console.log(`  Created ${totalPayments} payment records.`);

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log("\n=== Seed Complete ===");
  console.log(
    `Seeded ${gyms.length} gyms, ${instructorRecords.length} instructors, ${createdStudents.length} students, ${totalClasses} classes, ${totalSessions} sessions`
  );
  console.log(`  Attendance records: ${totalAttendance}`);
  console.log(`  Rank records: ${totalRanks}`);
  console.log(`  Payment records: ${totalPayments}`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
