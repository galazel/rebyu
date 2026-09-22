"""Aggregate health report over every parsed paper."""
import json, os, glob
D = "/app/scripts/fe_papers/parsed/"
tot = bad_ans = bad_count = bad_empty = figs = 0
papers = 0
problems = []
for path in sorted(glob.glob(D + "*.json")):
    name = os.path.basename(path)[:-5]
    recs = json.load(open(path, encoding="utf-8"))
    papers += 1
    for r in recs:
        tot += 1
        if r.get("image_key") or r["figures"]: figs += 1
        issues = []
        if not r["answer"]: issues.append("no-answer")
        if len(r["choices"]) != 4: issues.append("choices=%d" % len(r["choices"]))
        empties = [k for k, v in r["choices"].items() if not v.strip()]
        if empties and not r.get("choice_images"): issues.append("empty:" + ",".join(empties))
        if len(r["stem"]) < 15: issues.append("short-stem")
        if issues:
            problems.append((name, r["number"], issues))
            if "no-answer" in issues: bad_ans += 1
            elif any(i.startswith("choices=") for i in issues): bad_count += 1
            else: bad_empty += 1
print("papers=%d questions=%d with-figure=%d" % (papers, tot, figs))
print("problems: no-answer=%d wrong-choice-count=%d empty-or-short=%d  (total %d, %.1f%%)"
      % (bad_ans, bad_count, bad_empty, len(problems), 100.0*len(problems)/max(tot,1)))
for name, num, issues in problems[:400]:
    print("  %-16s Q%-4s %s" % (name, num, ", ".join(issues)))
