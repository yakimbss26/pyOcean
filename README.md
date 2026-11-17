# pyOCEAN 작품 갤러리

부산과학고등학교 해양생태탐구 동아리(파이오션) ESP32 활용 특강에서 학생들이 만든 센서 관제 시뮬레이터를 모아 보여 주는 GitHub Pages 사이트입니다.

- 갤러리: 작품 목록, 센서별 필터, 학번·이름 검색
- 교재: 내 시뮬레이터 HTML을 GitHub Pages에 올리는 7단계와 문제 해결
- 작품 내는 방법: Claude 갤러리 제출 또는 선생님께 보내기

## 사이트 켜기

1. 저장소 Settings → Pages
2. Build and deployment의 Source: Deploy from a branch
3. Branch: main, 폴더: / (root) → Save
4. 1~2분 뒤 https://yakimbss26.github.io/pyOcean/ 에서 확인

## 작품 추가하기

1. 작동 화면 사진(또는 짧은 영상)을 `images/` 폴더에 올립니다. 파일 이름은 영문·숫자로 (예: `1106-flood.png`).
2. `works.json`을 열고 연필 아이콘으로 수정해 작품 하나를 추가합니다. 형식은 `works.example.json`을 참고하세요.
3. Commit changes를 누르면 1~2분 뒤 사이트에 반영됩니다.

| 항목 | 내용 | 필수 |
|---|---|---|
| student | 학번 이름 (예: 1106 김건후) | 예 |
| title | 작품 이름 | 예 |
| oneLine | 한 줄 소개 | 예 |
| parts | 사용한 센서·부품 목록 | |
| url | 학생 작품의 GitHub Pages 주소 (https://) | |
| image | `images/파일이름` 또는 https 주소 | |
| desc | 작품 설명 | |
| date | 올린 날짜 (YYYY-MM-DD) | |

작품 여러 개는 `[ {...}, {...} ]`처럼 쉼표로 이어 적습니다. 쉼표나 따옴표가 하나라도 빠지면 목록이 안 보이니, 저장 전에 jsonlint.com 같은 곳에서 검사하면 안전합니다.

## 디자인

`DESIGN-pyocean.md`에 색, 글꼴, 마스코트 "부이" 규칙과 학생용 AI 디자인 프롬프트가 있습니다.
