/**
 * Static demo data for the signed-out interactive demo.
 * Shows a realistic user ~3 weeks into their interview prep.
 */

const today = new Date();
export const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
export const dateStr = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// Review queue: problems due for review (realistic overdue items)
const reviewQueue = [
  { stateId: "d1", problemId: 1, title: "Two Sum", leetcodeNumber: 1, neetcodeUrl: null, difficulty: "Easy" as const, category: "Arrays & Hashing", totalAttempts: 3, daysOverdue: 2, retrievability: 0.45, lastReviewedAt: daysAgo(8) },
  { stateId: "d2", problemId: 3, title: "Group Anagrams", leetcodeNumber: 49, neetcodeUrl: null, difficulty: "Medium" as const, category: "Arrays & Hashing", totalAttempts: 2, daysOverdue: 1, retrievability: 0.52, lastReviewedAt: daysAgo(6) },
  { stateId: "d3", problemId: 11, title: "Container With Most Water", leetcodeNumber: 11, neetcodeUrl: null, difficulty: "Medium" as const, category: "Two Pointers", totalAttempts: 2, daysOverdue: 3, retrievability: 0.38, lastReviewedAt: daysAgo(10) },
  { stateId: "d4", problemId: 15, title: "Valid Palindrome", leetcodeNumber: 125, neetcodeUrl: null, difficulty: "Easy" as const, category: "Two Pointers", totalAttempts: 2, daysOverdue: 1, retrievability: 0.61, lastReviewedAt: daysAgo(5) },
  { stateId: "d5", problemId: 20, title: "Min Stack", leetcodeNumber: 155, neetcodeUrl: null, difficulty: "Medium" as const, category: "Stack", totalAttempts: 1, daysOverdue: 4, retrievability: 0.31, lastReviewedAt: daysAgo(11) },
  { stateId: "d6", problemId: 21, title: "Evaluate Reverse Polish Notation", leetcodeNumber: 150, neetcodeUrl: null, difficulty: "Medium" as const, category: "Stack", totalAttempts: 1, daysOverdue: 2, retrievability: 0.48, lastReviewedAt: daysAgo(7) },
  { stateId: "d7", problemId: 30, title: "Binary Search", leetcodeNumber: 704, neetcodeUrl: null, difficulty: "Easy" as const, category: "Binary Search", totalAttempts: 2, daysOverdue: 1, retrievability: 0.55, lastReviewedAt: daysAgo(5) },
  { stateId: "d8", problemId: 42, title: "Trapping Rain Water", leetcodeNumber: 42, neetcodeUrl: null, difficulty: "Hard" as const, category: "Two Pointers", totalAttempts: 3, daysOverdue: 5, retrievability: 0.22, lastReviewedAt: daysAgo(12) },
];

// New problems (unattempted) — show first several from the curriculum
const newProblems = [
  { id: 35, leetcodeNumber: 33, title: "Search in Rotated Sorted Array", neetcodeUrl: null, difficulty: "Medium" as const, category: "Binary Search", blind75: true, leetcodeUrl: "" },
  { id: 36, leetcodeNumber: 153, title: "Find Minimum in Rotated Sorted Array", neetcodeUrl: null, difficulty: "Medium" as const, category: "Binary Search", blind75: true, leetcodeUrl: "" },
  { id: 37, leetcodeNumber: 981, title: "Time Based Key-Value Store", neetcodeUrl: null, difficulty: "Medium" as const, category: "Binary Search", blind75: false, leetcodeUrl: "" },
  { id: 38, leetcodeNumber: 4, title: "Median of Two Sorted Arrays", neetcodeUrl: null, difficulty: "Hard" as const, category: "Binary Search", blind75: true, leetcodeUrl: "" },
  { id: 40, leetcodeNumber: 206, title: "Reverse Linked List", neetcodeUrl: null, difficulty: "Easy" as const, category: "Linked List", blind75: true, leetcodeUrl: "" },
  { id: 41, leetcodeNumber: 21, title: "Merge Two Sorted Lists", neetcodeUrl: null, difficulty: "Easy" as const, category: "Linked List", blind75: true, leetcodeUrl: "" },
  { id: 42, leetcodeNumber: 143, title: "Reorder List", neetcodeUrl: null, difficulty: "Medium" as const, category: "Linked List", blind75: true, leetcodeUrl: "" },
  { id: 43, leetcodeNumber: 19, title: "Remove Nth Node From End of List", neetcodeUrl: null, difficulty: "Medium" as const, category: "Linked List", blind75: true, leetcodeUrl: "" },
];

// Completed problems (all attempted, some due & some not)
const completedProblems = [
  { problemId: 1, title: "Two Sum", leetcodeNumber: 1, difficulty: "Easy" as const, category: "Arrays & Hashing", totalAttempts: 3, retrievability: 0.45, stability: 12, lastReviewedAt: daysAgo(8), daysUntilReview: null, isDue: true, bestQuality: "optimal" },
  { problemId: 5, title: "Contains Duplicate", leetcodeNumber: 217, difficulty: "Easy" as const, category: "Arrays & Hashing", totalAttempts: 3, retrievability: 0.89, stability: 28, lastReviewedAt: daysAgo(3), daysUntilReview: 8, isDue: false, bestQuality: "optimal" },
  { problemId: 7, title: "Valid Anagram", leetcodeNumber: 242, difficulty: "Easy" as const, category: "Arrays & Hashing", totalAttempts: 4, retrievability: 0.94, stability: 45, lastReviewedAt: daysAgo(2), daysUntilReview: 14, isDue: false, bestQuality: "optimal" },
  { problemId: 3, title: "Group Anagrams", leetcodeNumber: 49, difficulty: "Medium" as const, category: "Arrays & Hashing", totalAttempts: 2, retrievability: 0.52, stability: 8, lastReviewedAt: daysAgo(6), daysUntilReview: null, isDue: true, bestQuality: "optimal" },
  { problemId: 9, title: "Top K Frequent Elements", leetcodeNumber: 347, difficulty: "Medium" as const, category: "Arrays & Hashing", totalAttempts: 2, retrievability: 0.71, stability: 15, lastReviewedAt: daysAgo(4), daysUntilReview: 3, isDue: false, bestQuality: "optimal" },
  { problemId: 6, title: "Product of Array Except Self", leetcodeNumber: 238, difficulty: "Medium" as const, category: "Arrays & Hashing", totalAttempts: 2, retrievability: 0.65, stability: 11, lastReviewedAt: daysAgo(5), daysUntilReview: 2, isDue: false, bestQuality: "optimal" },
  { problemId: 11, title: "Container With Most Water", leetcodeNumber: 11, difficulty: "Medium" as const, category: "Two Pointers", totalAttempts: 2, retrievability: 0.38, stability: 7, lastReviewedAt: daysAgo(10), daysUntilReview: null, isDue: true, bestQuality: "brute_force" },
  { problemId: 15, title: "Valid Palindrome", leetcodeNumber: 125, difficulty: "Easy" as const, category: "Two Pointers", totalAttempts: 2, retrievability: 0.61, stability: 9, lastReviewedAt: daysAgo(5), daysUntilReview: null, isDue: true, bestQuality: "optimal" },
  { problemId: 42, title: "Trapping Rain Water", leetcodeNumber: 42, difficulty: "Hard" as const, category: "Two Pointers", totalAttempts: 3, retrievability: 0.22, stability: 5, lastReviewedAt: daysAgo(12), daysUntilReview: null, isDue: true, bestQuality: "brute_force" },
  { problemId: 20, title: "Min Stack", leetcodeNumber: 155, difficulty: "Medium" as const, category: "Stack", totalAttempts: 1, retrievability: 0.31, stability: 4, lastReviewedAt: daysAgo(11), daysUntilReview: null, isDue: true, bestQuality: "optimal" },
  { problemId: 21, title: "Evaluate Reverse Polish Notation", leetcodeNumber: 150, difficulty: "Medium" as const, category: "Stack", totalAttempts: 1, retrievability: 0.48, stability: 6, lastReviewedAt: daysAgo(7), daysUntilReview: null, isDue: true, bestQuality: "optimal" },
  { problemId: 30, title: "Binary Search", leetcodeNumber: 704, difficulty: "Easy" as const, category: "Binary Search", totalAttempts: 2, retrievability: 0.55, stability: 8, lastReviewedAt: daysAgo(5), daysUntilReview: null, isDue: true, bestQuality: "optimal" },
  { problemId: 31, title: "Search a 2D Matrix", leetcodeNumber: 74, difficulty: "Medium" as const, category: "Binary Search", totalAttempts: 1, retrievability: 0.67, stability: 10, lastReviewedAt: daysAgo(4), daysUntilReview: 2, isDue: false, bestQuality: "optimal" },
  { problemId: 25, title: "Best Time to Buy and Sell Stock", leetcodeNumber: 121, difficulty: "Easy" as const, category: "Sliding Window", totalAttempts: 3, retrievability: 0.82, stability: 22, lastReviewedAt: daysAgo(3), daysUntilReview: 6, isDue: false, bestQuality: "optimal" },
  { problemId: 26, title: "Longest Substring Without Repeating Characters", leetcodeNumber: 3, difficulty: "Medium" as const, category: "Sliding Window", totalAttempts: 2, retrievability: 0.58, stability: 9, lastReviewedAt: daysAgo(6), daysUntilReview: 1, isDue: false, bestQuality: "optimal" },
  { problemId: 4, title: "Longest Consecutive Sequence", leetcodeNumber: 128, difficulty: "Medium" as const, category: "Arrays & Hashing", totalAttempts: 2, retrievability: 0.73, stability: 14, lastReviewedAt: daysAgo(4), daysUntilReview: 4, isDue: false, bestQuality: "optimal" },
];

// Activity history (14 days)
const attemptHistory = Array.from({ length: 14 }, (_, i) => {
  const idx = 13 - i;
  const counts = [2, 0, 3, 4, 2, 0, 5, 3, 4, 6, 3, 5, 4, 0];
  const newCounts = [1, 0, 1, 2, 1, 0, 2, 1, 2, 3, 1, 2, 2, 0];
  const c = counts[idx] ?? 0;
  const n = newCounts[idx] ?? 0;
  return { date: dateStr(idx), count: c, newCount: n, reviewCount: c - n };
});

const fullAttemptHistory = [...attemptHistory];

// Category stats
const categoryStats = [
  { category: "Arrays & Hashing", total: 9, attempted: 7, avgRetention: 0.72 },
  { category: "Two Pointers", total: 5, attempted: 3, avgRetention: 0.40 },
  { category: "Sliding Window", total: 6, attempted: 2, avgRetention: 0.70 },
  { category: "Stack", total: 7, attempted: 2, avgRetention: 0.40 },
  { category: "Binary Search", total: 7, attempted: 2, avgRetention: 0.61 },
  { category: "Linked List", total: 11, attempted: 0, avgRetention: 0 },
  { category: "Trees", total: 15, attempted: 0, avgRetention: 0 },
  { category: "Tries", total: 3, attempted: 0, avgRetention: 0 },
  { category: "Heap / Priority Queue", total: 7, attempted: 0, avgRetention: 0 },
  { category: "Backtracking", total: 9, attempted: 0, avgRetention: 0 },
  { category: "Graphs", total: 13, attempted: 0, avgRetention: 0 },
  { category: "Advanced Graphs", total: 6, attempted: 0, avgRetention: 0 },
  { category: "1-D Dynamic Programming", total: 12, attempted: 0, avgRetention: 0 },
  { category: "2-D Dynamic Programming", total: 11, attempted: 0, avgRetention: 0 },
  { category: "Greedy", total: 8, attempted: 0, avgRetention: 0 },
  { category: "Intervals", total: 6, attempted: 0, avgRetention: 0 },
  { category: "Math & Geometry", total: 8, attempted: 0, avgRetention: 0 },
  { category: "Bit Manipulation", total: 7, attempted: 0, avgRetention: 0 },
];

const difficultyBreakdown = [
  { difficulty: "Easy", count: 28, attempted: 6 },
  { difficulty: "Medium", count: 101, attempted: 8 },
  { difficulty: "Hard", count: 21, attempted: 1 },
];

const masteryList = [
  { problemId: 7, title: "Valid Anagram", leetcodeNumber: 242, stability: 45, category: "Arrays & Hashing" },
];

const learningList = [
  { problemId: 5, title: "Contains Duplicate", leetcodeNumber: 217, stability: 28, category: "Arrays & Hashing" },
  { problemId: 25, title: "Best Time to Buy and Sell Stock", leetcodeNumber: 121, stability: 22, category: "Sliding Window" },
  { problemId: 9, title: "Top K Frequent Elements", leetcodeNumber: 347, stability: 15, category: "Arrays & Hashing" },
  { problemId: 4, title: "Longest Consecutive Sequence", leetcodeNumber: 128, stability: 14, category: "Arrays & Hashing" },
  { problemId: 1, title: "Two Sum", leetcodeNumber: 1, stability: 12, category: "Arrays & Hashing" },
  { problemId: 6, title: "Product of Array Except Self", leetcodeNumber: 238, stability: 11, category: "Arrays & Hashing" },
  { problemId: 31, title: "Search a 2D Matrix", leetcodeNumber: 74, stability: 10, category: "Binary Search" },
  { problemId: 26, title: "Longest Substring Without Repeating Characters", leetcodeNumber: 3, stability: 9, category: "Sliding Window" },
  { problemId: 15, title: "Valid Palindrome", leetcodeNumber: 125, stability: 9, category: "Two Pointers" },
  { problemId: 3, title: "Group Anagrams", leetcodeNumber: 49, stability: 8, category: "Arrays & Hashing" },
  { problemId: 30, title: "Binary Search", leetcodeNumber: 704, stability: 8, category: "Binary Search" },
  { problemId: 11, title: "Container With Most Water", leetcodeNumber: 11, stability: 7, category: "Two Pointers" },
  { problemId: 21, title: "Evaluate Reverse Polish Notation", leetcodeNumber: 150, stability: 6, category: "Stack" },
  { problemId: 42, title: "Trapping Rain Water", leetcodeNumber: 42, stability: 5, category: "Two Pointers" },
  { problemId: 20, title: "Min Stack", leetcodeNumber: 155, stability: 4, category: "Stack" },
];

// Import problems (subset for demo — not interactive anyway)
const importProblems = [
  { id: 1, title: "Two Sum", leetcodeNumber: 1, difficulty: "Easy" as const, category: "Arrays & Hashing" },
];

// Demo pending GitHub submissions
const pendingSubmissions = [
  {
    id: "demo-pending-1",
    problemId: 33,
    problemTitle: "Search in Rotated Sorted Array",
    leetcodeNumber: 33,
    difficulty: "Medium" as const,
    category: "Binary Search",
    isReview: false,
    detectedAt: daysAgo(0),
  },
  {
    id: "demo-pending-2",
    problemId: 1,
    problemTitle: "Two Sum",
    leetcodeNumber: 1,
    difficulty: "Easy" as const,
    category: "Arrays & Hashing",
    isReview: true,
    detectedAt: daysAgo(0),
  },
];

export const DEMO_DASHBOARD_DATA = {
  reviewQueue,
  newProblems,
  completedProblems,
  totalProblems: 150,
  attemptedCount: 15,
  retainedCount: 9,
  readiness: { score: 28, tier: "D" as const },
  readinessBreakdown: { coverage: 0.10, retention: 0.60, categoryBalance: 0.22, consistency: 0.71 },
  currentStreak: 4,
  bestStreak: 6,
  avgPerDay: 2.9,
  avgNewPerDay: 1.1,
  avgReviewPerDay: 1.8,
  overallPerDay: 2.4,
  overallNewPerDay: 0.8,
  overallReviewPerDay: 1.6,
  categoryStats,
  difficultyBreakdown,
  attemptHistory,
  fullAttemptHistory,
  totalSolveMinutes: 320,
  totalStudyMinutes: 180,
  avgSolveMinutes: 18,
  avgConfidence: 3.2,
  masteredCount: 1,
  learningCount: 14,
  masteryList,
  learningList,
  importProblems,
  importAttemptedIds: completedProblems.map(p => p.problemId),
  importTodayAttemptedIds: [],
  pendingSubmissions,
};

/* ── Demo data for Activity page ── */

export const DEMO_ACTIVITY_DATA = {
  day: {
    date: dateStr(0),
    range: "day" as const,
    summary: {
      total: 7,
      newCount: 0,
      reviewCount: 7,
      solvedCount: 5,
      totalTime: 80,
      avgConfidence: 3.6,
    },
    items: [
      { attemptId: "demo-a1", problemId: 6, title: "Product of Array Except Self", leetcodeNumber: 238, difficulty: "Medium" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 3, solveTimeMinutes: 8, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(0), isNew: false },
      { attemptId: "demo-a2", problemId: 1, title: "Two Sum", leetcodeNumber: 1, difficulty: "Easy" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 5, solveTimeMinutes: 15, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(0), isNew: false },
      { attemptId: "demo-a3", problemId: 4, title: "Longest Consecutive Sequence", leetcodeNumber: 128, difficulty: "Medium" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 4, solveTimeMinutes: 4, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(0), isNew: false },
      { attemptId: "demo-a4", problemId: 7, title: "Valid Anagram", leetcodeNumber: 242, difficulty: "Easy" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 3, solveTimeMinutes: 15, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(0), isNew: false },
      { attemptId: "demo-a5", problemId: 9, title: "Top K Frequent Elements", leetcodeNumber: 347, difficulty: "Medium" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 3, solveTimeMinutes: 20, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: false, createdAt: daysAgo(0), isNew: false },
      { attemptId: "demo-a6", problemId: 42, title: "Trapping Rain Water", leetcodeNumber: 42, difficulty: "Hard" as const, category: "Two Pointers", solvedIndependently: "PARTIAL", solutionQuality: "BRUTE_FORCE", confidence: 3, solveTimeMinutes: 15, studyTimeMinutes: null, timeCorrect: false, spaceCorrect: false, createdAt: daysAgo(0), isNew: false },
      { attemptId: "demo-a7", problemId: 11, title: "Container With Most Water", leetcodeNumber: 11, difficulty: "Medium" as const, category: "Two Pointers", solvedIndependently: "PARTIAL", solutionQuality: "BRUTE_FORCE", confidence: 3, solveTimeMinutes: 3, studyTimeMinutes: null, timeCorrect: false, spaceCorrect: false, createdAt: daysAgo(0), isNew: false },
    ],
  },
  week: {
    date: dateStr(0),
    range: "week" as const,
    summary: {
      total: 26,
      newCount: 2,
      reviewCount: 24,
      solvedCount: 13,
      totalTime: 403,
      avgConfidence: 3.5,
    },
    items: [
      // Wed - day -3
      { attemptId: "demo-w1", problemId: 21, title: "Evaluate Reverse Polish Notation", leetcodeNumber: 150, difficulty: "Medium" as const, category: "Stack", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 4, solveTimeMinutes: 15, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(3), isNew: false },
      { attemptId: "demo-w2", problemId: 20, title: "Min Stack", leetcodeNumber: 155, difficulty: "Medium" as const, category: "Stack", solvedIndependently: "PARTIAL", solutionQuality: "BRUTE_FORCE", confidence: 4, solveTimeMinutes: 15, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(3), isNew: false },
      { attemptId: "demo-w3", problemId: 25, title: "Best Time to Buy and Sell Stock", leetcodeNumber: 121, difficulty: "Easy" as const, category: "Sliding Window", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 5, solveTimeMinutes: 5, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(3), isNew: false },
      // Thu - day -2
      { attemptId: "demo-w4", problemId: 30, title: "Binary Search", leetcodeNumber: 704, difficulty: "Easy" as const, category: "Binary Search", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 5, solveTimeMinutes: 5, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(2), isNew: false },
      { attemptId: "demo-w5", problemId: 31, title: "Search a 2D Matrix", leetcodeNumber: 74, difficulty: "Medium" as const, category: "Binary Search", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 4, solveTimeMinutes: 10, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(2), isNew: false },
      { attemptId: "demo-w6", problemId: 5, title: "Contains Duplicate", leetcodeNumber: 217, difficulty: "Easy" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 5, solveTimeMinutes: 3, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(2), isNew: false },
      { attemptId: "demo-w7", problemId: 3, title: "Group Anagrams", leetcodeNumber: 49, difficulty: "Medium" as const, category: "Arrays & Hashing", solvedIndependently: "PARTIAL", solutionQuality: "BRUTE_FORCE", confidence: 3, solveTimeMinutes: 20, studyTimeMinutes: null, timeCorrect: false, spaceCorrect: false, createdAt: daysAgo(2), isNew: false },
      // Fri - day -1
      { attemptId: "demo-w8", problemId: 26, title: "Longest Substring Without Repeating Characters", leetcodeNumber: 3, difficulty: "Medium" as const, category: "Sliding Window", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 3, solveTimeMinutes: 35, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(1), isNew: false },
      { attemptId: "demo-w9", problemId: 15, title: "Valid Palindrome", leetcodeNumber: 125, difficulty: "Easy" as const, category: "Two Pointers", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 4, solveTimeMinutes: 8, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(1), isNew: false },
      // Today
      ...([
        { attemptId: "demo-a1", problemId: 6, title: "Product of Array Except Self", leetcodeNumber: 238, difficulty: "Medium" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 3, solveTimeMinutes: 8, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(0), isNew: false },
        { attemptId: "demo-a2", problemId: 1, title: "Two Sum", leetcodeNumber: 1, difficulty: "Easy" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 5, solveTimeMinutes: 15, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(0), isNew: false },
        { attemptId: "demo-a3", problemId: 4, title: "Longest Consecutive Sequence", leetcodeNumber: 128, difficulty: "Medium" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 4, solveTimeMinutes: 4, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(0), isNew: false },
        { attemptId: "demo-a4", problemId: 7, title: "Valid Anagram", leetcodeNumber: 242, difficulty: "Easy" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 3, solveTimeMinutes: 15, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: true, createdAt: daysAgo(0), isNew: false },
        { attemptId: "demo-a5", problemId: 9, title: "Top K Frequent Elements", leetcodeNumber: 347, difficulty: "Medium" as const, category: "Arrays & Hashing", solvedIndependently: "YES", solutionQuality: "OPTIMAL", confidence: 3, solveTimeMinutes: 20, studyTimeMinutes: null, timeCorrect: true, spaceCorrect: false, createdAt: daysAgo(0), isNew: false },
        { attemptId: "demo-a6", problemId: 42, title: "Trapping Rain Water", leetcodeNumber: 42, difficulty: "Hard" as const, category: "Two Pointers", solvedIndependently: "PARTIAL", solutionQuality: "BRUTE_FORCE", confidence: 3, solveTimeMinutes: 15, studyTimeMinutes: null, timeCorrect: false, spaceCorrect: false, createdAt: daysAgo(0), isNew: false },
        { attemptId: "demo-a7", problemId: 11, title: "Container With Most Water", leetcodeNumber: 11, difficulty: "Medium" as const, category: "Two Pointers", solvedIndependently: "PARTIAL", solutionQuality: "BRUTE_FORCE", confidence: 3, solveTimeMinutes: 3, studyTimeMinutes: null, timeCorrect: false, spaceCorrect: false, createdAt: daysAgo(0), isNew: false },
      ]),
    ],
  },
};

/* ── Demo data for Review page ── */

export const DEMO_REVIEW_QUEUE = [
  { stateId: "d1", problemId: 1, title: "Two Sum", leetcodeNumber: 1, difficulty: "Easy" as const, category: "Arrays & Hashing", totalAttempts: 3, notes: "Use hash map for O(n). Watch for same-element edge case." },
  { stateId: "d3", problemId: 11, title: "Container With Most Water", leetcodeNumber: 11, difficulty: "Medium" as const, category: "Two Pointers", totalAttempts: 2, notes: "Two pointers from each end. Move the shorter one inward." },
  { stateId: "d5", problemId: 20, title: "Min Stack", leetcodeNumber: 155, difficulty: "Medium" as const, category: "Stack", totalAttempts: 1, notes: "Second stack tracking minimums. Push min on every push." },
  { stateId: "d6", problemId: 21, title: "Evaluate Reverse Polish Notation", leetcodeNumber: 150, difficulty: "Medium" as const, category: "Stack", totalAttempts: 1, notes: null },
  { stateId: "d7", problemId: 30, title: "Binary Search", leetcodeNumber: 704, difficulty: "Easy" as const, category: "Binary Search", totalAttempts: 2, notes: null },
  { stateId: "d8", problemId: 42, title: "Trapping Rain Water", leetcodeNumber: 42, difficulty: "Hard" as const, category: "Two Pointers", totalAttempts: 3, notes: "Two-pointer approach: track maxLeft and maxRight. Or precompute max arrays." },
  { stateId: "d2", problemId: 3, title: "Group Anagrams", leetcodeNumber: 49, difficulty: "Medium" as const, category: "Arrays & Hashing", totalAttempts: 2, notes: null },
  { stateId: "d4", problemId: 15, title: "Valid Palindrome", leetcodeNumber: 125, difficulty: "Easy" as const, category: "Two Pointers", totalAttempts: 2, notes: null },
];

/* ── Demo data for Stats page ── */

export const DEMO_STATS_DATA = {
  categoryStats,
  difficultyBreakdown: difficultyBreakdown.map(d => ({ ...d })),
  attemptHistory: Array.from({ length: 30 }, (_, i) => {
    const idx = 29 - i;
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 3, 4, 2, 0, 5, 3, 4, 6, 3, 5, 4, 0];
    return { date: dateStr(idx), count: counts[idx] ?? 0 };
  }),
  qualityDistribution: [
    { quality: "OPTIMAL", count: 24 },
    { quality: "SUBOPTIMAL", count: 5 },
    { quality: "BRUTE_FORCE", count: 12 },
    { quality: "NONE", count: 3 },
  ],
  retentionBuckets: [
    { label: "Strong", count: 4, color: "bg-green-500" },
    { label: "Good", count: 3, color: "bg-emerald-400" },
    { label: "Fading", count: 3, color: "bg-amber-500" },
    { label: "Weak", count: 3, color: "bg-orange-500" },
    { label: "Critical", count: 2, color: "bg-red-500" },
  ],
  totalSolveMinutes: 320,
  totalStudyMinutes: 180,
  avgSolveMinutes: 18,
  avgConfidence: 3.2,
};

/* ── Demo data for Drill page ── */

export const DEMO_DRILL_CATEGORIES = [
  {
    name: "Arrays & Hashing",
    total: 9,
    attempted: 7,
    avgRetention: 0.72,
    problems: [
      { id: 1, leetcodeNumber: 1, title: "Two Sum", difficulty: "Easy" as const, leetcodeUrl: "https://leetcode.com/problems/two-sum/", attempted: true, retention: 0.45, totalAttempts: 3 },
      { id: 5, leetcodeNumber: 217, title: "Contains Duplicate", difficulty: "Easy" as const, leetcodeUrl: "https://leetcode.com/problems/contains-duplicate/", attempted: true, retention: 0.89, totalAttempts: 3 },
      { id: 7, leetcodeNumber: 242, title: "Valid Anagram", difficulty: "Easy" as const, leetcodeUrl: "https://leetcode.com/problems/valid-anagram/", attempted: true, retention: 0.94, totalAttempts: 4 },
      { id: 3, leetcodeNumber: 49, title: "Group Anagrams", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/group-anagrams/", attempted: true, retention: 0.52, totalAttempts: 2 },
      { id: 9, leetcodeNumber: 347, title: "Top K Frequent Elements", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/top-k-frequent-elements/", attempted: true, retention: 0.71, totalAttempts: 2 },
      { id: 6, leetcodeNumber: 238, title: "Product of Array Except Self", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/product-of-array-except-self/", attempted: true, retention: 0.65, totalAttempts: 2 },
      { id: 4, leetcodeNumber: 128, title: "Longest Consecutive Sequence", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/longest-consecutive-sequence/", attempted: true, retention: 0.73, totalAttempts: 2 },
      { id: 2, leetcodeNumber: 271, title: "Encode and Decode Strings", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/encode-and-decode-strings/", attempted: false, retention: null, totalAttempts: 0 },
      { id: 8, leetcodeNumber: 36, title: "Valid Sudoku", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/valid-sudoku/", attempted: false, retention: null, totalAttempts: 0 },
    ],
  },
  {
    name: "Two Pointers",
    total: 5,
    attempted: 3,
    avgRetention: 0.40,
    problems: [
      { id: 15, leetcodeNumber: 125, title: "Valid Palindrome", difficulty: "Easy" as const, leetcodeUrl: "https://leetcode.com/problems/valid-palindrome/", attempted: true, retention: 0.61, totalAttempts: 2 },
      { id: 11, leetcodeNumber: 11, title: "Container With Most Water", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/container-with-most-water/", attempted: true, retention: 0.38, totalAttempts: 2 },
      { id: 42, leetcodeNumber: 42, title: "Trapping Rain Water", difficulty: "Hard" as const, leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water/", attempted: true, retention: 0.22, totalAttempts: 3 },
      { id: 12, leetcodeNumber: 15, title: "3Sum", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/3sum/", attempted: false, retention: null, totalAttempts: 0 },
      { id: 13, leetcodeNumber: 167, title: "Two Sum II", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", attempted: false, retention: null, totalAttempts: 0 },
    ],
  },
  {
    name: "Sliding Window",
    total: 6,
    attempted: 2,
    avgRetention: 0.70,
    problems: [
      { id: 25, leetcodeNumber: 121, title: "Best Time to Buy and Sell Stock", difficulty: "Easy" as const, leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", attempted: true, retention: 0.82, totalAttempts: 3 },
      { id: 26, leetcodeNumber: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", attempted: true, retention: 0.58, totalAttempts: 2 },
      { id: 27, leetcodeNumber: 424, title: "Longest Repeating Character Replacement", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/longest-repeating-character-replacement/", attempted: false, retention: null, totalAttempts: 0 },
      { id: 28, leetcodeNumber: 567, title: "Permutation In String", difficulty: "Medium" as const, leetcodeUrl: "https://leetcode.com/problems/permutation-in-string/", attempted: false, retention: null, totalAttempts: 0 },
      { id: 29, leetcodeNumber: 76, title: "Minimum Window Substring", difficulty: "Hard" as const, leetcodeUrl: "https://leetcode.com/problems/minimum-window-substring/", attempted: false, retention: null, totalAttempts: 0 },
      { id: 30, leetcodeNumber: 239, title: "Sliding Window Maximum", difficulty: "Hard" as const, leetcodeUrl: "https://leetcode.com/problems/sliding-window-maximum/", attempted: false, retention: null, totalAttempts: 0 },
    ],
  },
  { name: "Stack", total: 7, attempted: 2, avgRetention: 0.40, problems: [] },
  { name: "Binary Search", total: 7, attempted: 2, avgRetention: 0.61, problems: [] },
  { name: "Linked List", total: 11, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Trees", total: 15, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Tries", total: 3, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Heap / Priority Queue", total: 7, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Backtracking", total: 9, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Graphs", total: 13, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Advanced Graphs", total: 6, attempted: 0, avgRetention: 0, problems: [] },
  { name: "1-D Dynamic Programming", total: 12, attempted: 0, avgRetention: 0, problems: [] },
  { name: "2-D Dynamic Programming", total: 11, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Greedy", total: 8, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Intervals", total: 6, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Math & Geometry", total: 8, attempted: 0, avgRetention: 0, problems: [] },
  { name: "Bit Manipulation", total: 7, attempted: 0, avgRetention: 0, problems: [] },
];

/* ── Demo data for Mock Interview page ── */

export const DEMO_MOCK_INTERVIEW = {
  problems: [
    { id: 3, leetcodeNumber: 49, title: "Group Anagrams", difficulty: "Medium" as const, category: "Arrays & Hashing", leetcodeUrl: "https://leetcode.com/problems/group-anagrams/" },
    { id: 42, leetcodeNumber: 42, title: "Trapping Rain Water", difficulty: "Hard" as const, category: "Two Pointers", leetcodeUrl: "https://leetcode.com/problems/trapping-rain-water/" },
  ],
  categories: categoryStats.map(c => c.category),
  weakCategories: ["Two Pointers", "Stack"],
};

/* ── Demo problem states for Problems page ── */

export const DEMO_PROBLEM_STATES: Record<number, { retention: number; totalAttempts: number; lastReviewed: string | null; bestQuality: string | null }> = {};
for (const p of completedProblems) {
  DEMO_PROBLEM_STATES[p.problemId] = {
    retention: p.retrievability,
    totalAttempts: p.totalAttempts,
    lastReviewed: p.lastReviewedAt,
    bestQuality: p.bestQuality,
  };
}
