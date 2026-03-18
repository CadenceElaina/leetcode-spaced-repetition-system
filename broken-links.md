# NeetCode Link Fixes — RESOLVED

All 150 NeetCode URLs in problems.json have been updated to use the correct NeetCode slugs
(extracted from neetcode.io's JS bundle). Re-run `python3 scripts/check_neetcode_links.py`
to verify. Then re-seed the database with `npx tsx scripts/seed.ts`.
