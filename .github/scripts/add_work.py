"""작품 제출 이슈 본문을 읽어 works.json에 추가하거나 고친다.
환경변수: ISSUE_BODY, ISSUE_NUMBER, ISSUE_URL, ISSUE_DATE"""
import json, os, re, sys

body = os.environ.get("ISSUE_BODY", "")
num = int(os.environ["ISSUE_NUMBER"])

sections = {}
for m in re.finditer(r"^### (.+?)\s*\n(.*?)(?=^### |\Z)", body, re.S | re.M):
    val = m.group(2).strip()
    sections[m.group(1).strip()] = "" if val == "_No response_" else val

def get(key):
    return sections.get(key, "").strip()

student = re.sub(r"\s+", " ", get("학번 이름"))
student = re.sub(r"^(\d{4})(?=\S)", r"\1 ", student)
title = get("작품 이름")
if not student or not title:
    sys.exit("학번 이름 또는 작품 이름이 비어 있어요.")

parts = re.findall(r"^- \[[xX]\] (.+)$", get("사용한 센서·부품"), re.M)
parts = [p.strip() for p in parts]
for p in re.split(r"[,，、]", get("목록에 없는 센서·부품")):
    p = re.sub(r"\s+", " ", p).strip()
    if p and p not in parts:
        parts.append(p[:20])

url = get("작품 주소 (GitHub Pages)")
url = url if re.match(r"^https://\S+$", url) else ""

media = get("작동 화면")
m = re.search(r"(https://[^\s)\"'<>]+)", media)
image = m.group(1) if m else ""
before = media[:m.start()] if m else ""
is_img = bool(re.search(r"(<img[^>]*src=[\"']?|!\[[^\]]*\]\()$", before)) or bool(re.search(r"\.(png|jpe?g|gif|webp)(\?|$)", image, re.I))
media_type = "image" if is_img else ("video" if image else "")

work = {
    "id": num,
    "student": student[:20],
    "title": title[:40],
    "oneLine": get("한 줄 소개")[:80],
    "parts": parts,
    "url": url,
    "image": image,
    "mediaType": media_type,
    "desc": get("작품 설명")[:800],
    "date": os.environ.get("ISSUE_DATE", "")[:10],
    "issue": os.environ.get("ISSUE_URL", ""),
}

path = "works.json"
with open(path, encoding="utf-8") as f:
    works = json.load(f)
works = [w for w in works if w.get("id") != num]
works.append(work)
with open(path, "w", encoding="utf-8") as f:
    json.dump(works, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"#{num} {student} - {title} 게시")
