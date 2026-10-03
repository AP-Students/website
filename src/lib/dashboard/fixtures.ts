import { Timestamp } from "firebase/firestore";
import type {
  ActivityCalendar,
  ActivityEvent,
  AppNotification,
  InProgressItem,
  InProgressReading,
  SavedItem,
  UserStats,
} from "@/types/dashboard";

/**
 * Deterministic mock data for building dashboard UI without Firebase.
 *
 * Matches the mockups: level 51 with 2,103 XP to level 52, 432 problems
 * solved, 5 subjects, and the three "recent activity" rows verbatim.
 * "Today" is pinned to 2026-09-20 in America/Los_Angeles so output never drifts.
 * Nothing here touches the network — `Timestamp` is only used as a value class.
 *
 * Placeholders (not derived from real code yet): the level curve behind
 * `xpForNextLevel`, XP amounts per activity, and the `?question=` deep link.
 */

const UID = "fixture-user-1";
const TIME_ZONE = "America/Los_Angeles";
/** All fixture times fall in September (PDT), so a fixed -07:00 offset is right. */
const PDT_OFFSET = "-07:00";

/** "2026-09-20T14:12:00" (local, LA) -> Timestamp. */
const at = (local: string) =>
  Timestamp.fromDate(new Date(`${local}${PDT_OFFSET}`));
/** The user's-timezone day key is just the date part of the local string. */
const dayKeyOf = (local: string) => local.slice(0, 10);

const NOW = at("2026-09-20T18:00:00");

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const sub = (
  subjectSlug: string,
  attempted: number,
  correct: number,
  readingsCompleted: number,
  totalReadings: number,
  lastActive: string,
) => ({
  subjectSlug,
  attempted,
  correct,
  readingsCompleted,
  totalReadings,
  lastActiveAt: at(lastActive),
});

export const FIXTURE_STATS: UserStats = {
  uid: UID,
  xp: 61_897,
  level: 51,
  xpIntoLevel: 1_897,
  xpForNextLevel: 4_000, // band size: 4,000 - 1,897 = 2,103 XP to level 52
  currentStreak: 12,
  longestStreak: 34,
  lastActiveDay: "2026-09-20",
  timeZone: TIME_ZONE,
  readingsCompleted: 87,
  mcqTestsCompleted: 34,
  problemsSolved: 432, // = sum of perSubject[*].correct
  frqsSubmitted: 9,
  subjectsCompleted: 5,
  perSubject: {
    "ap-calculus-ab": sub(
      "ap-calculus-ab",
      151,
      118,
      24,
      30,
      "2026-09-17T19:40:00",
    ),
    "ap-physics-2": sub("ap-physics-2", 127, 96, 19, 28, "2026-09-20T14:12:00"),
    "ap-environmental-science": sub(
      "ap-environmental-science",
      109,
      88,
      17,
      25,
      "2026-09-15T16:05:00",
    ),
    "ap-cybersecurity": sub(
      "ap-cybersecurity",
      96,
      74,
      15,
      22,
      "2026-09-18T20:30:00",
    ),
    "ap-english-literature": sub(
      "ap-english-literature",
      71,
      56,
      12,
      20,
      "2026-09-12T17:15:00",
    ),
  },
  updatedAt: NOW,
};

// ---------------------------------------------------------------------------
// Activity events (newest first)
// ---------------------------------------------------------------------------

type EventInput = Pick<
  ActivityEvent,
  | "type"
  | "subject"
  | "unitId"
  | "sourceId"
  | "label"
  | "href"
  | "xpAwarded"
  | "gradeStatus"
> &
  Partial<Pick<ActivityEvent, "score" | "questions">> & { local: string };

const event = ({ local, ...rest }: EventInput): ActivityEvent => ({
  id: `${UID}_${rest.type}_${rest.sourceId}`,
  userId: UID,
  occurredAt: at(local),
  dayKey: dayKeyOf(local),
  ...rest,
});

const q = (index: number, topic: string, correct: boolean) => ({
  index,
  topic,
  correct,
});
const testHref = (
  subject: string,
  unit: string,
  testId: string,
  question?: number,
) =>
  `/subject/${subject}/${unit}/test/${testId}${question ? `?question=${question}` : ""}`;
const readingHref = (
  subject: string,
  unit: string,
  chapterId: string,
  title: string,
) => `/subject/${subject}/${unit}/chapter/${chapterId}/${title}`;
const frqHref = (subject: string, unit: string, frqId: string) =>
  `/subject/${subject}/${unit}/frq/${frqId}`;

export const FIXTURE_EVENTS: ActivityEvent[] = [
  // --- The mockup's three rows, verbatim -----------------------------------
  event({
    local: "2026-09-20T14:12:00",
    type: "mcq_test",
    subject: "ap-physics-2",
    unitId: "unit-3",
    sourceId: "physics2-u3-test",
    label: "Unit 3 Test",
    href: testHref("ap-physics-2", "unit-3", "physics2-u3-test", 14),
    xpAwarded: 70,
    gradeStatus: "none",
    score: { correct: 4, total: 5 },
    questions: [
      q(12, "Electric potential", true),
      q(13, "Capacitors", true),
      q(14, "Gravitational acceleration scaling", false),
      q(15, "Field lines", true),
      q(16, "Potential energy", true),
    ],
  }),
  event({
    local: "2026-09-20T09:48:00",
    type: "mcq_test",
    subject: "ap-us-government",
    unitId: "unit-1",
    sourceId: "usgov-u1-test",
    label: "Unit 1 Test",
    href: testHref("ap-us-government", "unit-1", "usgov-u1-test", 127),
    xpAwarded: 55,
    gradeStatus: "none",
    score: { correct: 3, total: 4 },
    questions: [
      q(125, "Federalism", true),
      q(126, "Separation of powers", true),
      q(127, "Enumerated powers", false),
      q(128, "Checks and balances", true),
    ],
  }),
  event({
    local: "2026-09-19T21:03:00",
    type: "mcq_test",
    subject: "ap-cybersecurity",
    unitId: "unit-2",
    sourceId: "cyber-u2-test",
    label: "Unit 2 Test",
    href: testHref("ap-cybersecurity", "unit-2", "cyber-u2-test", 2),
    xpAwarded: 45,
    gradeStatus: "none",
    score: { correct: 2, total: 4 },
    questions: [
      q(1, "Threat modeling", true),
      q(2, "Symmetric encryption", false),
      q(3, "Hashing", true),
      q(4, "Key exchange", false),
    ],
  }),

  // --- Everything else -------------------------------------------------------
  event({
    local: "2026-09-19T16:20:00",
    type: "reading",
    subject: "ap-physics-2",
    unitId: "unit-3",
    sourceId: "gravitational-acceleration-scaling",
    label: "Gravitational Acceleration Scaling",
    href: readingHref(
      "ap-physics-2",
      "unit-3",
      "gravitational-acceleration-scaling",
      "gravitational-acceleration-scaling",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
  event({
    local: "2026-09-18T20:30:00",
    type: "frq",
    subject: "ap-cybersecurity",
    unitId: "unit-2",
    sourceId: "cyber-u2-frq-1",
    label: "Unit 2 FRQ 1",
    href: frqHref("ap-cybersecurity", "unit-2", "cyber-u2-frq-1"),
    xpAwarded: 50,
    gradeStatus: "pending",
  }),
  event({
    local: "2026-09-18T15:45:00",
    type: "mcq_test",
    subject: "ap-calculus-ab",
    unitId: "unit-4",
    sourceId: "calcab-u4-test",
    label: "Unit 4 Test",
    href: testHref("ap-calculus-ab", "unit-4", "calcab-u4-test"),
    xpAwarded: 85,
    gradeStatus: "none",
    score: { correct: 8, total: 10 },
    questions: [
      q(1, "Related rates", true),
      q(2, "Related rates", true),
      q(3, "Linearization", true),
      q(4, "MVT", false),
      q(5, "Extrema", true),
      q(6, "Extrema", true),
      q(7, "Optimization", true),
      q(8, "Optimization", false),
      q(9, "L'Hopital", true),
      q(10, "Concavity", true),
    ],
  }),
  event({
    local: "2026-09-17T19:40:00",
    type: "reading",
    subject: "ap-calculus-ab",
    unitId: "unit-4",
    sourceId: "related-rates",
    label: "Related Rates",
    href: readingHref(
      "ap-calculus-ab",
      "unit-4",
      "related-rates",
      "related-rates",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
  event({
    local: "2026-09-17T13:10:00",
    type: "frq",
    subject: "ap-english-literature",
    unitId: "unit-2",
    sourceId: "englit-u2-frq-1",
    label: "Poetry Analysis",
    href: frqHref("ap-english-literature", "unit-2", "englit-u2-frq-1"),
    xpAwarded: 60,
    gradeStatus: "graded",
  }),
  event({
    local: "2026-09-16T18:25:00",
    type: "mcq_test",
    subject: "ap-environmental-science",
    unitId: "unit-5",
    sourceId: "envsci-u5-test",
    label: "Unit 5 Test",
    href: testHref("ap-environmental-science", "unit-5", "envsci-u5-test"),
    xpAwarded: 60,
    gradeStatus: "none",
    score: { correct: 5, total: 6 },
    questions: [
      q(1, "Land use", true),
      q(2, "Soil", true),
      q(3, "Agriculture", true),
      q(4, "Irrigation", false),
      q(5, "Pest control", true),
      q(6, "Aquaculture", true),
    ],
  }),
  event({
    local: "2026-09-16T12:00:00",
    type: "reading",
    subject: "ap-environmental-science",
    unitId: "unit-5",
    sourceId: "soil-composition",
    label: "Soil Composition",
    href: readingHref(
      "ap-environmental-science",
      "unit-5",
      "soil-composition",
      "soil-composition",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
  event({
    local: "2026-09-15T16:05:00",
    type: "mcq_test",
    subject: "ap-environmental-science",
    unitId: "unit-4",
    sourceId: "envsci-u4-test",
    label: "Unit 4 Test",
    href: testHref("ap-environmental-science", "unit-4", "envsci-u4-test"),
    xpAwarded: 50,
    gradeStatus: "none",
    score: { correct: 3, total: 5 },
    questions: [
      q(1, "Plate tectonics", true),
      q(2, "Earthquakes", false),
      q(3, "Atmosphere", true),
      q(4, "Global winds", false),
      q(5, "El Nino", true),
    ],
  }),
  event({
    local: "2026-09-14T20:15:00",
    type: "frq",
    subject: "ap-physics-2",
    unitId: "unit-2",
    sourceId: "physics2-u2-frq-1",
    label: "Fluid Dynamics Lab Design",
    href: frqHref("ap-physics-2", "unit-2", "physics2-u2-frq-1"),
    xpAwarded: 50,
    gradeStatus: "self_graded",
  }),
  event({
    local: "2026-09-13T17:30:00",
    type: "reading",
    subject: "ap-cybersecurity",
    unitId: "unit-2",
    sourceId: "public-key-cryptography",
    label: "Public-Key Cryptography",
    href: readingHref(
      "ap-cybersecurity",
      "unit-2",
      "public-key-cryptography",
      "public-key-cryptography",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
  event({
    local: "2026-09-12T17:15:00",
    type: "reading",
    subject: "ap-english-literature",
    unitId: "unit-2",
    sourceId: "sonnet-structure",
    label: "Sonnet Structure",
    href: readingHref(
      "ap-english-literature",
      "unit-2",
      "sonnet-structure",
      "sonnet-structure",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
  event({
    local: "2026-09-11T19:00:00",
    type: "mcq_test",
    subject: "ap-physics-2",
    unitId: "unit-2",
    sourceId: "physics2-u2-test",
    label: "Unit 2 Test",
    href: testHref("ap-physics-2", "unit-2", "physics2-u2-test"),
    xpAwarded: 75,
    gradeStatus: "none",
    score: { correct: 6, total: 8 },
    questions: [
      q(1, "Pressure", true),
      q(2, "Buoyancy", true),
      q(3, "Bernoulli", false),
      q(4, "Continuity", true),
      q(5, "Pressure", true),
      q(6, "Buoyancy", true),
      q(7, "Bernoulli", false),
      q(8, "Viscosity", true),
    ],
  }),
  event({
    local: "2026-09-10T14:40:00",
    type: "reading",
    subject: "ap-calculus-ab",
    unitId: "unit-3",
    sourceId: "chain-rule",
    label: "The Chain Rule",
    href: readingHref(
      "ap-calculus-ab",
      "unit-3",
      "chain-rule",
      "the-chain-rule",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
  event({
    local: "2026-09-09T18:10:00",
    type: "mcq_test",
    subject: "ap-us-government",
    unitId: "unit-1",
    sourceId: "usgov-u1-quiz-2",
    label: "Unit 1 Quiz 2",
    href: testHref("ap-us-government", "unit-1", "usgov-u1-quiz-2"),
    xpAwarded: 40,
    gradeStatus: "none",
    score: { correct: 2, total: 3 },
    questions: [
      q(1, "Constitution", true),
      q(2, "Bill of Rights", true),
      q(3, "Amendments", false),
    ],
  }),
  event({
    local: "2026-09-08T15:20:00",
    type: "frq",
    subject: "ap-calculus-ab",
    unitId: "unit-3",
    sourceId: "calcab-u3-frq-1",
    label: "Unit 3 FRQ 1",
    href: frqHref("ap-calculus-ab", "unit-3", "calcab-u3-frq-1"),
    xpAwarded: 60,
    gradeStatus: "graded",
  }),
  event({
    local: "2026-09-06T16:45:00",
    type: "reading",
    subject: "ap-environmental-science",
    unitId: "unit-4",
    sourceId: "atmospheric-circulation",
    label: "Atmospheric Circulation",
    href: readingHref(
      "ap-environmental-science",
      "unit-4",
      "atmospheric-circulation",
      "atmospheric-circulation",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
  event({
    local: "2026-09-04T20:05:00",
    type: "mcq_test",
    subject: "ap-cybersecurity",
    unitId: "unit-1",
    sourceId: "cyber-u1-test",
    label: "Unit 1 Test",
    href: testHref("ap-cybersecurity", "unit-1", "cyber-u1-test"),
    xpAwarded: 65,
    gradeStatus: "none",
    score: { correct: 5, total: 7 },
    questions: [
      q(1, "CIA triad", true),
      q(2, "Threat actors", true),
      q(3, "Risk", true),
      q(4, "Controls", false),
      q(5, "Social engineering", true),
      q(6, "Malware", false),
      q(7, "Phishing", true),
    ],
  }),
  event({
    local: "2026-09-02T13:30:00",
    type: "reading",
    subject: "ap-physics-2",
    unitId: "unit-2",
    sourceId: "bernoullis-principle",
    label: "Bernoulli's Principle",
    href: readingHref(
      "ap-physics-2",
      "unit-2",
      "bernoullis-principle",
      "bernoullis-principle",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
  event({
    local: "2026-09-01T17:55:00",
    type: "frq",
    subject: "ap-english-literature",
    unitId: "unit-1",
    sourceId: "englit-u1-frq-1",
    label: "Prose Fiction Analysis",
    href: frqHref("ap-english-literature", "unit-1", "englit-u1-frq-1"),
    xpAwarded: 60,
    gradeStatus: "graded",
  }),
  event({
    local: "2026-08-30T15:00:00",
    type: "reading",
    subject: "ap-calculus-ab",
    unitId: "unit-3",
    sourceId: "product-quotient-rules",
    label: "Product and Quotient Rules",
    href: readingHref(
      "ap-calculus-ab",
      "unit-3",
      "product-quotient-rules",
      "product-and-quotient-rules",
    ),
    xpAwarded: 10,
    gradeStatus: "none",
  }),
];

// ---------------------------------------------------------------------------
// Calendar — calendar year 2026, through "today" (Sep 20). Later days are absent.
// ---------------------------------------------------------------------------

/**
 * Deliberately uneven so the heatmap's relative ramp has to renormalize:
 *   Feb 1  - Apr 30  quiet stretch, never above 3
 *   Jun 1  - Aug 15  busy stretch, peaks at exactly 10
 *   everything else  moderate, never above 5
 * Global max is 10, so the quiet stretch should read pale against the busy one.
 * Sparse like Firestore: days with zero activity have no key.
 */
const buildCalendarDays = (): Record<string, number> => {
  const days: Record<string, number> = {};
  const jan1 = Date.UTC(2026, 0, 1);
  const DAY_MS = 86_400_000;
  const totalDays = 263; // Jan 1 .. Sep 20 inclusive

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(jan1 + i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const month = d.getUTCMonth(); // 0-based
    const dom = d.getUTCDate();
    // Fixed linear-congruential "random" in [0, 1): same output every run.
    const r = ((i * 9301 + 49297) % 233280) / 233280;

    let count: number;
    if (month >= 1 && month <= 3) {
      // Feb-Apr: 0..3, with a guaranteed 3 every 9th day.
      count =
        i % 9 === 0 ? 3 : r < 0.3 ? 0 : Math.min(3, 1 + Math.floor(r * 3));
    } else if (month === 5 || month === 6 || (month === 7 && dom <= 15)) {
      // Jun 1 - Aug 15: 0..10, with a guaranteed 10 every 11th day.
      count =
        i % 11 === 0 ? 10 : r < 0.1 ? 0 : Math.min(10, 2 + Math.floor(r * 9));
    } else {
      // Jan, May, Aug 16 - Sep 20: 0..5.
      count = r < 0.25 ? 0 : Math.min(5, 1 + Math.floor(r * 5));
    }
    if (count > 0) days[key] = count;
  }

  // Make the tail agree with FIXTURE_EVENTS (all of which are in the moderate stretch).
  for (const e of FIXTURE_EVENTS) {
    const fromEvents = FIXTURE_EVENTS.filter(
      (x) => x.dayKey === e.dayKey,
    ).length;
    days[e.dayKey] = Math.max(days[e.dayKey] ?? 0, fromEvents);
  }
  return days;
};

export const FIXTURE_CALENDAR: ActivityCalendar = {
  uid: UID,
  year: 2026,
  days: buildCalendarDays(),
  updatedAt: NOW,
};

// ---------------------------------------------------------------------------
// Saved / in progress / notifications
// ---------------------------------------------------------------------------

export const FIXTURE_SAVED: SavedItem[] = [
  {
    id: `${UID}_question_physics2-u3-test_14`,
    kind: "question",
    subject: "ap-physics-2",
    unitId: "unit-3",
    refId: "physics2-u3-test",
    questionIndex: 14,
    label: "Unit 3 Test · Q14",
    topic: "Gravitational acceleration scaling",
    href: testHref("ap-physics-2", "unit-3", "physics2-u3-test", 14),
    savedAt: at("2026-09-20T14:15:00"),
  },
  {
    id: `${UID}_question_usgov-u1-test_127`,
    kind: "question",
    subject: "ap-us-government",
    unitId: "unit-1",
    refId: "usgov-u1-test",
    questionIndex: 127,
    label: "Unit 1 Test · Q127",
    topic: "Enumerated powers",
    href: testHref("ap-us-government", "unit-1", "usgov-u1-test", 127),
    savedAt: at("2026-09-20T09:50:00"),
  },
  {
    id: `${UID}_reading_related-rates`,
    kind: "reading",
    subject: "ap-calculus-ab",
    unitId: "unit-4",
    refId: "related-rates",
    label: "Related Rates",
    href: readingHref(
      "ap-calculus-ab",
      "unit-4",
      "related-rates",
      "related-rates",
    ),
    savedAt: at("2026-09-17T19:45:00"),
  },
  {
    id: `${UID}_reading_public-key-cryptography`,
    kind: "reading",
    subject: "ap-cybersecurity",
    unitId: "unit-2",
    refId: "public-key-cryptography",
    label: "Public-Key Cryptography",
    href: readingHref(
      "ap-cybersecurity",
      "unit-2",
      "public-key-cryptography",
      "public-key-cryptography",
    ),
    savedAt: at("2026-09-13T17:35:00"),
  },
];

export const FIXTURE_IN_PROGRESS: InProgressItem[] = [
  {
    id: `${UID}_mcq_test_calcab-u5-test`,
    kind: "mcq_test",
    subject: "ap-calculus-ab",
    unitId: "unit-5",
    refId: "calcab-u5-test",
    label: "Unit 5 Test",
    href: testHref("ap-calculus-ab", "unit-5", "calcab-u5-test"),
    startedAt: at("2026-09-20T16:30:00"),
    updatedAt: at("2026-09-20T16:52:00"),
    state: {
      answers: { 0: ["B"], 1: ["D"], 2: ["A"], 3: ["C"] },
      currentIndex: 4,
      secondsRemaining: 1_740,
    },
  },
  {
    id: `${UID}_mcq_test_envsci-u6-test`,
    kind: "mcq_test",
    subject: "ap-environmental-science",
    unitId: "unit-6",
    refId: "envsci-u6-test",
    label: "Unit 6 Test",
    href: testHref("ap-environmental-science", "unit-6", "envsci-u6-test"),
    startedAt: at("2026-09-19T18:00:00"),
    updatedAt: at("2026-09-19T18:10:00"),
    state: {
      answers: { 0: ["A", "C"], 1: ["B"] },
      currentIndex: 2,
      secondsRemaining: 2_950,
    },
  },
  {
    id: `${UID}_frq_englit-u3-frq-1`,
    kind: "frq",
    subject: "ap-english-literature",
    unitId: "unit-3",
    refId: "englit-u3-frq-1",
    label: "Argument Essay",
    href: frqHref("ap-english-literature", "unit-3", "englit-u3-frq-1"),
    startedAt: at("2026-09-18T15:00:00"),
    updatedAt: at("2026-09-19T21:20:00"),
    state: {
      responses: {
        thesis:
          "Dickinson uses slant rhyme to unsettle the reader's expectations of closure.",
      },
    },
  },
];

/** Readings in progress are derived, not stored — see `InProgressReading`. */
export const FIXTURE_IN_PROGRESS_READINGS: InProgressReading[] = [
  {
    kind: "reading",
    subject: "ap-physics-2",
    unitId: "unit-3",
    chapterId: "gauss-law",
    label: "Gauss's Law",
    href: readingHref("ap-physics-2", "unit-3", "gauss-law", "gauss-law"),
    progress: "Reading",
  },
  {
    kind: "reading",
    subject: "ap-calculus-ab",
    unitId: "unit-5",
    chapterId: "curve-sketching",
    label: "Curve Sketching",
    href: readingHref(
      "ap-calculus-ab",
      "unit-5",
      "curve-sketching",
      "curve-sketching",
    ),
    progress: "Practicing",
  },
  {
    kind: "reading",
    subject: "ap-cybersecurity",
    unitId: "unit-2",
    chapterId: "block-ciphers",
    label: "Block Ciphers",
    href: readingHref(
      "ap-cybersecurity",
      "unit-2",
      "block-ciphers",
      "block-ciphers",
    ),
    progress: "Need Review",
  },
];

const THIRTY_DAYS_MS = 30 * 86_400_000;
const expiresAfter = (created: string) =>
  Timestamp.fromMillis(at(created).toMillis() + THIRTY_DAYS_MS);

export const FIXTURE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-level-up-51",
    type: "level_up",
    title: "Level 51 reached",
    body: "You hit level 51. 2,103 XP to go until level 52.",
    href: "/account",
    createdAt: at("2026-09-20T09:49:00"),
    readAt: null,
    expiresAt: expiresAfter("2026-09-20T09:49:00"),
  },
  {
    id: "notif-frq-graded-englit",
    type: "frq_graded",
    title: "FRQ graded",
    body: "Your Poetry Analysis FRQ was graded. Check the feedback.",
    href: "/frq-feedback/englit-u2-frq-1",
    createdAt: at("2026-09-19T10:00:00"),
    readAt: null,
    expiresAt: expiresAfter("2026-09-19T10:00:00"),
  },
  {
    id: "notif-achievement-streak-10",
    type: "achievement",
    title: "10-day streak",
    body: "You studied 10 days in a row. Keep it going.",
    href: "/account",
    createdAt: at("2026-09-18T20:31:00"),
    readAt: at("2026-09-19T08:00:00"),
    expiresAt: expiresAfter("2026-09-18T20:31:00"),
  },
  {
    id: "notif-frq-graded-calcab",
    type: "frq_graded",
    title: "FRQ graded",
    body: "Your Unit 3 FRQ 1 was graded. Check the feedback.",
    href: "/frq-feedback/calcab-u3-frq-1",
    createdAt: at("2026-09-09T12:00:00"),
    readAt: at("2026-09-09T18:00:00"),
    expiresAt: expiresAfter("2026-09-09T12:00:00"),
  },
];

// ---------------------------------------------------------------------------
// Empty-state exports
// ---------------------------------------------------------------------------

export const EMPTY_EVENTS: ActivityEvent[] = [];
export const EMPTY_SAVED: SavedItem[] = [];
export const EMPTY_IN_PROGRESS: InProgressItem[] = [];
export const EMPTY_IN_PROGRESS_READINGS: InProgressReading[] = [];
export const EMPTY_NOTIFICATIONS: AppNotification[] = [];
