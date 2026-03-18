"""
Check which neetcode.io problem URLs in problems.json are valid.
Uses headless Chrome in parallel for speed.

Usage:
  python3 scripts/check_neetcode_links.py
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed


def check_url(problem):
    """Return (problem, exists) tuple."""
    url = problem.get("neetcodeUrl")
    if not url:
        return (problem, None)
    full = url + "/question"
    try:
        result = subprocess.run(
            [
                "google-chrome", "--headless", "--dump-dom",
                "--no-sandbox", "--disable-gpu",
                "--virtual-time-budget=5000",
                full,
            ],
            capture_output=True, text=True, timeout=30,
        )
        exists = "this problem does not exist" not in result.stdout.lower()
        return (problem, exists)
    except Exception as e:
        print(f"  ERROR {problem['title']}: {e}", file=sys.stderr)
        return (problem, False)


def main():
    with open("problems.json") as f:
        data = json.load(f)

    problems = data["problems"]
    broken = []
    ok_count = 0
    total = len([p for p in problems if p.get("neetcodeUrl")])

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(check_url, p): p for p in problems if p.get("neetcodeUrl")}
        done = 0
        for future in as_completed(futures):
            problem, exists = future.result()
            done += 1
            if exists is None:
                continue
            label = f"[{done}/{total}] #{problem['leetcodeNumber']} {problem['title']}"
            if exists:
                ok_count += 1
                sys.stdout.write(f"  OK  {label}\n")
            else:
                broken.append(problem)
                sys.stdout.write(f" FAIL {label}  ->  {problem['neetcodeUrl']}\n")
            sys.stdout.flush()

    broken.sort(key=lambda p: p["leetcodeNumber"])
    print(f"\n{'='*60}")
    print(f"Results: {ok_count} OK, {len(broken)} BROKEN out of {ok_count + len(broken)} total")
    if broken:
        print(f"\nBroken problems (need manual correction in problems.json):")
        for p in broken:
            print(f"  #{p['leetcodeNumber']:>4}  {p['title']:<50}  {p['neetcodeUrl']}")


if __name__ == "__main__":
    main()
