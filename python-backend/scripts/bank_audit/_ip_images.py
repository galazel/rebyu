"""Are the figure images the imported IP questions point at actually in S3?

Read-only. A question whose `image_key` resolves to nothing renders as a
broken figure, and for these papers the figure often IS the question -- the
stem says "in the description below" and the description is the picture.
"""
import glob
import json
import os
import sys

sys.path.insert(0, "/app")

from app.papers.figures import _s3

need = set()
for path in sorted(glob.glob("/app/scripts/fe_papers/parsed/*_IP.json")):
    for record in json.load(open(path, encoding="utf-8")):
        if record.get("image_key"):
            need.add(record["image_key"])
        for key in (record.get("choice_images") or {}).values():
            if key:
                need.add(key)

print("image keys referenced by IP papers: %d" % len(need))

client, bucket = _s3()
have = set()
token = None
while True:
    kwargs = {"Bucket": bucket, "Prefix": "fe-past-papers/"}
    if token:
        kwargs["ContinuationToken"] = token
    page = client.list_objects_v2(**kwargs)
    for item in page.get("Contents", []):
        have.add(item["Key"])
    if not page.get("IsTruncated"):
        break
    token = page.get("NextContinuationToken")

print("objects under fe-past-papers/ in bucket %s: %d" % (bucket, len(have)))

missing = sorted(need - have)
print("\nreferenced but NOT in the bucket: %d" % len(missing))
for key in missing[:25]:
    print("   ", key)
if len(missing) > 25:
    print("    ... and %d more" % (len(missing) - 25))

papers = sorted({k.split("/")[1] for k in missing})
print("\npapers needing an upload: %d" % len(papers))
print("   ", " ".join(papers))
