import sys, pymupdf
doc = pymupdf.open("/app/scripts/fe_papers/pdf/" + sys.argv[1] + "_Questions.pdf")
page = doc[int(sys.argv[2]) - 1]
for b in page.get_text("dict")["blocks"]:
    if b.get("type") != 0: continue
    for l in b["lines"]:
        t = "".join(s["text"] for s in l["spans"])
        if t.strip():
            x0,y0,x1,y1 = l["bbox"]
            print(f"x={x0:6.1f}-{x1:6.1f} y={y0:6.1f} | {t[:70]}")
print("--- DRAWINGS ---")
for d in page.get_drawings():
    r = d["rect"]
    print(f"  {r.width:6.1f}x{r.height:6.1f} at y={r.y0:6.1f} x={r.x0:6.1f}")
