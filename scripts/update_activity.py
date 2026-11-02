"""Fetch public LeetCode + GitHub activity into data/activity.json (run daily by .github/workflows/activity.yml)."""
import json, re, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

LEETCODE_USER = "Sakshamm_codes"
GITHUB_USER = "devSaksham"
OUT = Path(__file__).resolve().parent.parent / "data" / "activity.json"
UA = {"User-Agent": "sakshamagrawal.me activity updater"}


def leetcode():
    q = """query($u:String!){matchedUser(username:$u){
      submitStatsGlobal{acSubmissionNum{difficulty count}}
      userCalendar{streak totalActiveDays submissionCalendar}}}"""
    req = urllib.request.Request(
        "https://leetcode.com/graphql",
        data=json.dumps({"query": q, "variables": {"u": LEETCODE_USER}}).encode(),
        headers={**UA, "Content-Type": "application/json", "Referer": "https://leetcode.com"})
    user = json.load(urllib.request.urlopen(req, timeout=30))["data"]["matchedUser"]
    cal = user["userCalendar"]
    days = {}
    for ts, n in json.loads(cal["submissionCalendar"]).items():
        day = datetime.fromtimestamp(int(ts), timezone.utc).strftime("%Y-%m-%d")
        days[day] = days.get(day, 0) + n
    solved = {s["difficulty"]: s["count"] for s in user["submitStatsGlobal"]["acSubmissionNum"]}
    return {"days": days, "solved": solved, "streak": cal["streak"], "activeDays": cal["totalActiveDays"]}


def github():
    req = urllib.request.Request(f"https://github.com/users/{GITHUB_USER}/contributions", headers=UA)
    html = urllib.request.urlopen(req, timeout=30).read().decode()
    ids = dict(re.findall(r'data-date="([\d-]+)" id="(contribution-day-component-[\d-]+)"', html))
    tips = dict(re.findall(r'for="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)', html))
    days = {}
    for day, cid in ids.items():
        m = re.match(r"(\d+) contribution", tips.get(cid, ""))
        days[day] = int(m.group(1)) if m else 0
    return {"days": days, "total": sum(days.values())}


def main():
    data = {"updated": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
    for name, fn in (("leetcode", leetcode), ("github", github)):
        try:
            data[name] = fn()
        except Exception as e:  # keep yesterday's numbers rather than wiping the heatmap
            print(f"{name} failed: {e}", file=sys.stderr)
            if OUT.exists():
                data[name] = json.loads(OUT.read_text()).get(name)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(data, separators=(",", ":"), sort_keys=True))
    lc = data.get("leetcode") or {}
    print("leetcode days:", len(lc.get("days", {})), "| github total:", (data.get("github") or {}).get("total"))


if __name__ == "__main__":
    main()
