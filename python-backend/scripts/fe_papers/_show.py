import json, sys
recs = json.load(open("/app/scripts/fe_papers/parsed/" + sys.argv[1] + ".json", encoding="utf-8"))
want = {int(x) for x in sys.argv[2:]}
for r in recs:
    if want and r["number"] not in want: continue
    print(f"--- Q{r['number']}  answer={r['answer']}  figures={len(r['figures'])} ---")
    print("STEM:", r["stem"][:400])
    for k, v in r["choices"].items():
        print(f"   {k}) {v[:110]}")
    for f in r["figures"]:
        print("   FIG page", f["page"]+1, [round(x) for x in f["rect"]])
