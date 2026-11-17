/**
 * pyOCEAN 작품 접수 서버 (Google Apps Script)
 * - 학생: 갤러리 사이트의 "작품 내기" 양식으로 로그인 없이 제출
 * - 선생님: 이 구글 시트의 "게시" 칸에 체크하면 갤러리에 나타남
 * 설치 방법은 apps-script/README.md 참고
 */
const SHEET_NAME = '작품';
const FOLDER_NAME = 'pyOCEAN 작품 사진';
const HEAD = ['접수 시각', '학번 이름', '작품 이름', '한 줄 소개', '센서·부품', '작품 주소', '사진 주소', '작품 설명', '게시', '좋아요', 'id', '사진 파일 ID'];
const COL = Object.fromEntries(HEAD.map((h, i) => [h, i + 1]));
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** 처음 한 번 실행: 시트 머리줄, 체크박스, 사진 폴더를 만든다 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]).setFontWeight('bold').setBackground('#DDF0F1');
  sh.setFrozenRows(1);
  sh.getRange(2, COL['게시'], sh.getMaxRows() - 1, 1).insertCheckboxes();
  sh.setColumnWidth(COL['작품 설명'], 320);
  sh.hideColumns(COL['id'], 2);
  getFolder_();
  Logger.log('준비 완료');
}

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

/** 게시된 작품 목록 */
function doGet(e) {
  const sh = getSheet_();
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).getValues() : [];
  const works = rows.filter(r => r[COL['게시'] - 1] === true && r[COL['id'] - 1]).map(r => ({
    id: String(r[COL['id'] - 1]),
    student: r[COL['학번 이름'] - 1],
    title: r[COL['작품 이름'] - 1],
    oneLine: r[COL['한 줄 소개'] - 1],
    parts: String(r[COL['센서·부품'] - 1] || '').split(',').map(s => s.trim()).filter(Boolean),
    url: /^https:\/\//.test(r[COL['작품 주소'] - 1]) ? r[COL['작품 주소'] - 1] : '',
    image: r[COL['사진 주소'] - 1] || '',
    desc: r[COL['작품 설명'] - 1],
    likes: Number(r[COL['좋아요'] - 1]) || 0,
    date: Utilities.formatDate(new Date(r[COL['접수 시각'] - 1]), 'Asia/Seoul', 'yyyy-MM-dd'),
  }));
  return json_({ ok: true, works: works });
}

/** 작품 제출, 좋아요 */
function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: '보낸 내용을 읽지 못했어요.' }); }
  if (data.website) return json_({ ok: true }); // 자동 입력 봇 거르기
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (data.action === 'like') return like_(data);
    if (data.action === 'submit') return submit_(data);
    return json_({ ok: false, error: '알 수 없는 요청이에요.' });
  } finally {
    lock.releaseLock();
  }
}

function submit_(d) {
  let student = clean_(d.student, 20).replace(/^(\d{4})(?=\S)/, '$1 ');
  const title = clean_(d.title, 40);
  const oneLine = clean_(d.oneLine, 80);
  const desc = String(d.desc || '').trim().slice(0, 800);
  if (!/^\d{4} \S{2,}/.test(student)) return json_({ ok: false, error: '학번 네 자리와 이름을 함께 적어 주세요.' });
  if (!title || !oneLine || !desc) return json_({ ok: false, error: '빈 칸을 채워 주세요.' });
  const parts = (Array.isArray(d.parts) ? d.parts : []).map(p => clean_(p, 20)).filter(Boolean).slice(0, 15).join(', ');
  const url = /^https:\/\/\S+$/.test(String(d.url || '').trim()) ? String(d.url).trim().slice(0, 300) : '';

  let imageUrl = '', fileId = '';
  if (d.image && d.image.data) {
    const type = String(d.image.type || '');
    if (!/^image\/(jpeg|png|webp|gif)$/.test(type)) return json_({ ok: false, error: '사진은 JPG, PNG 파일로 올려 주세요.' });
    const bytes = Utilities.base64Decode(d.image.data);
    if (bytes.length > MAX_IMAGE_BYTES) return json_({ ok: false, error: '사진이 너무 커요. 4MB 이하로 올려 주세요.' });
    const name = student.replace(/\s/g, '_') + '_' + Date.now() + (type === 'image/png' ? '.png' : '.jpg');
    const file = getFolder_().createFile(Utilities.newBlob(bytes, type, name));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    fileId = file.getId();
    imageUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600';
  }
  if (!imageUrl) return json_({ ok: false, error: '작동 화면 사진을 올려 주세요.' });

  const id = Utilities.getUuid().slice(0, 8);
  const sh = getSheet_();
  sh.appendRow([new Date(), student, title, oneLine, parts, url, imageUrl, desc, false, 0, id, fileId]);
  sh.getRange(sh.getLastRow(), COL['게시']).insertCheckboxes();
  return json_({ ok: true, id: id });
}

function like_(d) {
  const id = String(d.id || '');
  const delta = d.undo ? -1 : 1;
  const sh = getSheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return json_({ ok: false });
  const ids = sh.getRange(2, COL['id'], n, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) {
      const cell = sh.getRange(i + 2, COL['좋아요']);
      const v = Math.max(0, (Number(cell.getValue()) || 0) + delta);
      cell.setValue(v);
      return json_({ ok: true, likes: v });
    }
  }
  return json_({ ok: false });
}
