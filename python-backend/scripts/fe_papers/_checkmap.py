import json, sys, random
recs = json.load(open("/app/scripts/fe_papers/parsed/" + sys.argv[1] + ".json", encoding="utf-8"))
random.seed(7)
sample = random.sample(recs, min(14, len(recs)))
for r in sorted(sample, key=lambda x: -x["lesson_score"]):
    print(f"[{r['lesson_score']:.2f}] Q{r['number']:<3} -> {r['lesson_name'][:52]}")
    print(f"        {r['stem'][:118]}")
