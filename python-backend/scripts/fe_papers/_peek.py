import sys, pymupdf
doc = pymupdf.open("/app/scripts/fe_papers/pdf/" + sys.argv[1])
print("pages:", doc.page_count)
for i in range(min(int(sys.argv[2]) if len(sys.argv) > 2 else 3, doc.page_count)):
    print(f"\n########## PAGE {i+1} ##########")
    print(doc[i].get_text())
