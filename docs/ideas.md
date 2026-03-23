# Feature Ideas & Opportunities

> Ideas noticed during development. Not committed to any timeline — just captured for future consideration.

---

## Study & Practice

- **Spaced repetition visualization** — Show a visual timeline of upcoming reviews (next 7/30 days) so users can anticipate workload and plan study sessions. Would help students batch reviews around class schedules.

- **"Explain it to me" mode** — After solving a problem, prompt the user to type a plain-English explanation of their approach (like teaching it to someone). Research shows the Feynman technique boosts retention. Could feed into a richer SRS signal.

- **Pattern tagging beyond categories** — Problems often map to multiple patterns (e.g., "Two Sum" is both hash map and two pointers). Add multi-tagging so drill mode can target cross-cutting patterns like "monotonic stack" or "backtracking + pruning."

- **Difficulty recalibration** — NeetCode's Easy/Medium/Hard labels don't always match real interview difficulty. Track users' actual solve rates and surface a "community difficulty" score alongside the official one.

- **Built-in timer with auto-pause** — Optional countdown that starts when you open a problem and pauses when you switch tabs. Removes the need to manually enter solve time.

- **Warm-up queue** — Before a review session, offer 1–2 easy problems from strong categories as a "warm-up." Builds confidence and gets into flow state before hitting weak spots.

## Social & Community

- **Anonymous aggregate stats** — "78% of users solve this problem in under 15 minutes" or "Most common mistake: forgetting edge case for empty array." No accounts exposed, just aggregate signals.

- **Study group mode** — Let friends create a shared study plan and compare progress (opt-in). Accountability partners are one of the strongest motivators for interview prep.

- **Problem-specific tips (community-sourced)** — Let users submit short tips per problem ("Watch out for negative numbers" / "Think about it as a graph problem"). Curated or upvoted, not a full discussion forum.

## Interview Prep

- **Company tag mapping** — Map NeetCode 150 problems to companies that frequently ask them (data from public sources like Blind/LC discuss). Filter problems by target company.

- **Interview simulation reports** — After a mock interview, generate a report: "You solved 1/2 problems. Time management: spent 35 min on the medium, 10 min on the hard. Recommendation: practice time allocation."

- **Behavioral prep integration** — Interview prep isn't just algorithms. Add a separate behavioral question bank with STAR framework templates. Could alternate between technical and behavioral review.

- **Estimated readiness by company tier** — Beyond the S–D tier system, map tiers to specific company groupings: "Your current profile is competitive for Series A startups but you'd want to reach Tier A for FAANG."

## UX & Quality of Life

- **Keyboard shortcuts** — j/k to navigate review queue, Enter to start review, s to skip. Power users doing 20 reviews/day would love this.

- **Problem attempt history diff** — Show side-by-side or inline diff of your solution from attempt N vs attempt N-1. Visualize how your approach evolved.

- **Mobile-first review mode** — A stripped-down mobile view for reviewing notes and marking problems as "still remembered" during commutes. Doesn't need code entry, just the review signal.

- **Streak & consistency tracking** — Show current streak, longest streak, and a GitHub-style contribution calendar. Gamification that actually aligns with the goal.

- **Data export & portability** — Full JSON/CSV export of all attempts, notes, and SRS state. Users should own their data completely.

## Technical

- **Offline support (PWA)** — Cache problem metadata and review queue for offline review. Sync when back online. Great for studying on flights or in areas with poor connectivity.

- **Webhooks / API** — Let users integrate with other tools. Zapier integration for "when I complete a review, log it in my Google Sheet" or "send me a daily Slack reminder with due count."

- **Multi-language code storage** — Let users store solutions in multiple languages per problem. Useful for people who prep in Python but interview in Java, or who want to practice the same problem in different languages.
