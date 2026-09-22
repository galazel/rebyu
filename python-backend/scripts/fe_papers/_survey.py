import os, re, pymupdf
d = "/app/scripts/fe_papers/pdf/"
for f in sorted(os.listdir(d)):
    doc = pymupdf.open(d + f)
    text = "".join(doc[i].get_text() for i in range(min(doc.page_count, 30)))
    qs = sorted({int(m) for m in re.findall(r"^Q(\d+)\.", text, re.M)})
    imgs = sum(len(doc[i].get_images(full=True)) for i in range(doc.page_count))
    draw = sum(len(doc[i].get_drawings()) for i in range(doc.page_count))
    print(f"{f:<32} pages={doc.page_count:<4} Q={len(qs):<4} max={max(qs) if qs else 0:<4} imgs={imgs:<4} vec={draw}")
    doc.close()
