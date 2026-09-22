import sys, pymupdf
doc = pymupdf.open("/app/scripts/fe_papers/pdf/" + sys.argv[1])
for i in range(int(sys.argv[2]) - 1, min(int(sys.argv[3]), doc.page_count)):
    print(f"\n########## PAGE {i+1} ##########")
    print(doc[i].get_text())
