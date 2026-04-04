import pdfplumber
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

file_path = sys.argv[1]

with pdfplumber.open(file_path) as pdf:
    text = "\n".join(page.extract_text() or "" for page in pdf.pages)

print(text)
