"""Fetch public LeetCode + GitHub activity into data/activity.json (run every few hours by .github/workflows/activity.yml).

Each source is retried, and a source that still fails keeps its previous numbers (so the heatmap is never wiped) and keeps its
previous "asOf" date (so the page never claims stale data is fresh). The script then exits non-zero so the workflow run shows
as failed and GitHub emails you, instead of failing silently."""
import json, re, sys, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path

LEETCODE_USER = "Sakshamm_codes"
GITHUB_USER = "devSaksham"
OUT = Path(__file__).resolve().parent.parent / "data" / "activity.json"
UA = {"User-Agent": "sakshamagrawal.me activity updater"}


def retry(fn, tries=3, delay=4):
    """Public endpoints fail now and then (rate limits, a bot check, a blip): try a few times before giving up."""
    for i in range(tries):
        try:
            return fn()
        except Exception as e:
            if i == tries - 1:
                raise
            print(f"  attempt {i + 1} failed ({e}); retrying", file=sys.stderr)
            time.sleep(delay * (i + 1))


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


def contest():
    q = """query($u:String!){
      userContestRanking(username:$u){rating attendedContestsCount globalRanking topPercentage}
      userContestRankingHistory(username:$u){attended rating ranking contest{title startTime}}}"""
    req = urllib.request.Request(
        "https://leetcode.com/graphql",
        data=json.dumps({"query": q, "variables": {"u": LEETCODE_USER}}).encode(),
        headers={**UA, "Content-Type": "application/json", "Referer": "https://leetcode.com"})
    d = json.load(urllib.request.urlopen(req, timeout=30))["data"]
    rank = d["userContestRanking"]
    history = [{"title": h["contest"]["title"],
                "date": datetime.fromtimestamp(h["contest"]["startTime"], timezone.utc).strftime("%Y-%m-%d"),
                "rating": round(h["rating"]), "rank": h["ranking"]}
               for h in d["userContestRankingHistory"] if h["attended"]]
    return {"rating": round(rank["rating"]), "attended": rank["attendedContestsCount"],
            "top": rank["topPercentage"], "globalRank": rank["globalRanking"], "history": history}


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
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    data, as_of, failed = {}, dict(old.get("asOf") or {}), []
    for name, fn in (("leetcode", leetcode), ("contest", contest), ("github", github)):
        try:
            data[name] = retry(fn)
            as_of[name] = today
        except Exception as e:  # keep the last good numbers rather than wiping the heatmap
            print(f"{name} FAILED after retries: {e}", file=sys.stderr)
            failed.append(name)
            data[name] = old.get(name)
            as_of.setdefault(name, old.get("updated"))  # older files had a single date
    data["asOf"] = as_of
    # the overall date only moves forward when something really refreshed
    data["updated"] = today if len(failed) < 3 else old.get("updated", today)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(data, separators=(",", ":"), sort_keys=True))
    lc = data.get("leetcode") or {}
    print("leetcode days:", len(lc.get("days", {})), "| github total:", (data.get("github") or {}).get("total"), "| failed:", failed or "none")
    if failed:
        sys.exit(1)  # data was kept, but make the run show as failed so you are told


if __name__ == "__main__":
    main()
