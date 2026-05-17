import type {
  VelocityResult,
  ComplianceResult,
  MetacognitionResult,
  CategoryStat,
  CalibrationBucket,
} from "@/lib/analytics";
import type { MasteryItem } from "@/lib/capacity";

export interface StuckProblemDisplay {
  problemId: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  totalAttempts: number;
  bestQuality: "OPTIMAL" | "SUBOPTIMAL" | "BRUTE_FORCE" | "NONE" | null;
  daysSinceFirstAttempt: number;
}

export interface InsightsData {
  velocity: VelocityResult;
  compliance: ComplianceResult;
  metacognition: MetacognitionResult;
  stuckProblems: StuckProblemDisplay[];
  categoryStats: CategoryStat[];
  totalAttempts: number;
  totalProblems: number;
  calibration: { n: number; mae: number | null; buckets: CalibrationBucket[] };
  readiness: { score: number; tier: "S" | "A" | "B" | "C" | "D" };
  readinessBreakdown: { coverage: number; retention: number; categoryBalance: number; consistency: number };
  consistencyReviewed: number;
  masteredCount: number;
  learningCount: number;
  masteryList: MasteryItem[];
  learningList: MasteryItem[];
}

export const DEMO_INSIGHTS_DATA: InsightsData = {
  velocity: {
    newProblemsPerDay: 0.57,
    trend: "improving",
    recentUniqueNew: 8,
    priorUniqueNew: 6,
  },
  compliance: {
    complianceRate: 0.83,
    reviewedInWindow: 19,
    reviewsScheduledInWindow: 23,
    currentlyOverdue: 4,
    neverReviewed: 0,
  },
  metacognition: {
    overconfidenceRate: 0.06,
    underconfidenceRate: 0.09,
    overconfidentAttempts: 8,
    underconfidentAttempts: 12,
    totalAttempts: 134,
  },
  stuckProblems: [
    {
      problemId: 93,
      title: "Alien Dictionary",
      difficulty: "Hard",
      totalAttempts: 6,
      bestQuality: "BRUTE_FORCE",
      daysSinceFirstAttempt: 28,
    },
    {
      problemId: 16,
      title: "Minimum Window Substring",
      difficulty: "Hard",
      totalAttempts: 5,
      bestQuality: "NONE",
      daysSinceFirstAttempt: 19,
    },
  ],
  categoryStats: [
    { category: "Arrays & Hashing",       attemptedProblems: 9, avgR: 0.82, stuckCount: 0, avgAttemptsToOptimal: 1.8, complexityAccuracyRate: 0.71 },
    { category: "Two Pointers",           attemptedProblems: 5, avgR: 0.74, stuckCount: 0, avgAttemptsToOptimal: 2.1, complexityAccuracyRate: 0.66 },
    { category: "Stack",                  attemptedProblems: 7, avgR: 0.77, stuckCount: 0, avgAttemptsToOptimal: 1.9, complexityAccuracyRate: 0.63 },
    { category: "Sliding Window",         attemptedProblems: 4, avgR: 0.64, stuckCount: 0, avgAttemptsToOptimal: 2.4, complexityAccuracyRate: 0.54 },
    { category: "Binary Search",          attemptedProblems: 6, avgR: 0.61, stuckCount: 0, avgAttemptsToOptimal: 2.6, complexityAccuracyRate: 0.52 },
    { category: "Trees",                  attemptedProblems: 8, avgR: 0.58, stuckCount: 0, avgAttemptsToOptimal: 2.8, complexityAccuracyRate: 0.47 },
    { category: "Graphs",                 attemptedProblems: 3, avgR: 0.44, stuckCount: 0, avgAttemptsToOptimal: 3.3, complexityAccuracyRate: 0.38 },
    { category: "Advanced Graphs",        attemptedProblems: 2, avgR: 0.32, stuckCount: 1, avgAttemptsToOptimal: null, complexityAccuracyRate: 0.22 },
  ],
  totalAttempts: 134,
  totalProblems: 44,
  calibration: {
    n: 47,
    mae: 0.09,
    buckets: [
      { rRange: [0.3,  0.5 ], predictedMidpoint: 0.40,  actualSuccessRate: 0.36, count: 11 },
      { rRange: [0.5,  0.65], predictedMidpoint: 0.575, actualSuccessRate: 0.60, count:  9 },
      { rRange: [0.65, 0.8 ], predictedMidpoint: 0.725, actualSuccessRate: 0.71, count: 13 },
      { rRange: [0.8,  0.9 ], predictedMidpoint: 0.85,  actualSuccessRate: 0.88, count:  8 },
      { rRange: [0.9,  1.01], predictedMidpoint: 0.955, actualSuccessRate: 0.93, count:  6 },
    ],
  },
  readiness: { score: 23, tier: "D" },
  readinessBreakdown: { coverage: 0.23, retention: 0.20, categoryBalance: 0.30, consistency: 0.21 },
  consistencyReviewed: 3,
  masteredCount: 5,
  learningCount: 30,
  masteryList: [
    { problemId: 1,   title: "Two Sum",           leetcodeNumber: 1,   stability: 365, category: "Arrays & Hashing" },
    { problemId: 242, title: "Valid Anagram",      leetcodeNumber: 242, stability: 365, category: "Arrays & Hashing" },
    { problemId: 49,  title: "Group Anagrams",     leetcodeNumber: 49,  stability: 365, category: "Arrays & Hashing" },
    { problemId: 125, title: "Valid Palindrome",   leetcodeNumber: 125, stability: 310, category: "Two Pointers" },
    { problemId: 20,  title: "Valid Parentheses",  leetcodeNumber: 20,  stability: 280, category: "Stack" },
  ],
  learningList: [
    { problemId: 150, title: "Evaluate Reverse Polish Notation", leetcodeNumber: 150, stability: 25.7, category: "Stack" },
    { problemId: 238, title: "Product of Array Except Self",     leetcodeNumber: 238, stability: 28.5, category: "Arrays & Hashing" },
    { problemId: 125, title: "Valid Palindrome",                 leetcodeNumber: 125, stability: 28.8, category: "Two Pointers" },
    { problemId: 20,  title: "Valid Parentheses",                leetcodeNumber: 20,  stability: 30.7, category: "Stack" },
  ],
};
