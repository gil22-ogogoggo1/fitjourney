# Sprint 1: 기반 정비 & 편집 기능

- **기간**: 2026-03-13
- **브랜치**: master
- **상태**: ✅ 완료

---

## 목표

1. 앱 이름을 **"핏저니(FitJourney)"**로 리브랜딩
2. 전체 XSS 보안 취약점 수정
3. 스키마 마이그레이션 시스템 구축
4. 모든 기록(투약/체중/운동/식사)에 편집 기능 추가

---

## 구현 내용

### Task 1 — 리브랜딩 (`index.html`, `app.js`)

- `<title>` 태그: `마운자로 다이어트 트래커` → `핏저니 | FitJourney`
- 헤더 및 대시보드 타이틀: `대시보드` 유지, `마운자로 투약` → `투약 기록`
- 헤더 H1 그라디언트 텍스트로 앱 이름 표시

### Task 2 — `escapeHTML()` 유틸 (`js/storage.js`)

```js
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

- `storage.js` 최상단에 전역 함수로 선언
- `storage.js`가 가장 먼저 로드되므로 모든 페이지 모듈에서 즉시 사용 가능

### Task 3 — XSS 수정 (모든 페이지 모듈)

수정된 취약점:

| 파일 | 위치 | 내용 |
|------|------|------|
| `mounjaro.js` | `renderList()` | `r.memo` → `escapeHTML(r.memo)` |
| `body.js` | `renderList()` | `r.memo` → `escapeHTML(r.memo)` |
| `exercise.js` | `renderList()` | `r.memo`, `s.name` → `escapeHTML()` 처리 |
| `diet.js` | `renderList()` | `r.content`, `r.memo` → `escapeHTML()` 처리 |
| `dashboard.js` | `_renderRecentDiet()` | `r.content` → `escapeHTML(r.content)` |

**수정 전 (취약):**
```js
${r.memo ? `<div class="record-meta">"${r.memo}"</div>` : ''}
```

**수정 후 (안전):**
```js
${r.memo ? `<div class="record-meta">"${escapeHTML(r.memo)}"</div>` : ''}
```

### Task 4 — 마이그레이션 시스템 (`js/storage.js`)

```js
const SCHEMA_VERSION = 1;

function migrate() {
  const current = parseInt(localStorage.getItem('mj_version') || '0');
  if (current >= SCHEMA_VERSION) return;

  // v0 → v1: mounjaro 기록에 drugName 기본값 추가
  if (current < 1) {
    try {
      const raw = localStorage.getItem('mj_mounjaro');
      if (raw) {
        const records = JSON.parse(raw);
        records.forEach(r => { if (!r.drugName) r.drugName = 'mounjaro'; });
        localStorage.setItem('mj_mounjaro', JSON.stringify(records));
      }
    } catch(e) { /* 무시 */ }
  }

  localStorage.setItem('mj_version', SCHEMA_VERSION.toString());
}

migrate(); // 앱 로드 시 자동 실행
```

- `mj_version` 키로 중복 실행 방지
- 기존 사용자 데이터의 하위 호환성 보장

### Task 5 — 편집 모달 공통 로직 (`js/app.js`)

`App.Modal` 객체로 바텀시트 모달 공통 제어:

```js
Modal: {
  open(contentHTML) {
    document.getElementById('edit-modal-content').innerHTML = contentHTML;
    document.getElementById('edit-modal').classList.remove('hidden');
  },
  close() {
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-modal-content').innerHTML = '';
  },
},
```

- 모달 오버레이 외부 클릭 시 자동 닫기
- 기존 `.modal-overlay` + `.modal-sheet` CSS 재사용

### Task 6~9 — 각 페이지 편집 기능

모든 페이지 모듈에 동일한 패턴 적용:

```
편집 버튼 클릭
  → openEdit(id)
  → Storage.getById() → 현재 값으로 폼 채움
  → App.Modal.open(폼 HTML)
  → 사용자 수정 후 "수정 완료" 클릭
  → saveEdit(id)
  → Storage.update()
  → App.Modal.close()
  → renderList() 재렌더
```

| 페이지 | 특이사항 |
|--------|---------|
| 투약 (`mounjaro.js`) | 부작용 체크박스 상태 복원, 용량/부위 select 선택값 복원 |
| 체중 (`body.js`) | 인바디 상세 필드(체지방·근육·BMI·체수분·내장지방) 모두 편집 가능 |
| 운동 (`exercise.js`) | 운동 종류에 따라 편집 필드 동적 변경; 웨이트는 세트 행 추가/삭제 지원 |
| 식사 (`diet.js`) | 날짜별 그룹 뷰에서 각 행에 편집 버튼 노출 |

---

## 테스트 추가

- `tests/storage.test.js` 작성 (Jest + jsdom)
- 테스트 항목: `escapeHTML`, `Storage.add/getAll/update/remove/getById/getRecent`, `migrate`
- 커버리지 대상: `js/storage.js`

---

## 검증 체크리스트

- ✅ 헤더/타이틀이 "핏저니"로 표시
- ✅ 각 기록 리스트에 "편집" 버튼 노출
- ✅ 편집 → 모달 열림 → 수정 완료 → 리스트 즉시 반영
- ✅ 사용자 입력에 `<script>` 태그 입력 시 이스케이프 확인
- ✅ 기존 데이터 유실 없음 (새로고침 후 확인)
- ✅ 모달 오버레이 외부 클릭 시 닫힘
- ✅ 단위 테스트 전체 통과 (`npm test`)
- ⬜ 모바일(375px) 편집 모달 레이아웃 — 브라우저 직접 확인 필요
- ⬜ 오프라인 환경에서 Chart.js CDN 미로드 시 graceful degradation

---

## 주요 변경 파일

```
index.html          ← 타이틀 변경
js/storage.js       ← escapeHTML, migrate, module.exports
js/app.js           ← 리브랜딩, App.Modal, 편집 모달 HTML
css/style.css       ← .modal-title, .btn-edit 추가
js/mounjaro.js      ← XSS 수정 + openEdit/saveEdit
js/body.js          ← XSS 수정 + openEdit/saveEdit
js/exercise.js      ← XSS 수정 + openEdit/saveEdit (웨이트 세트 포함)
js/diet.js          ← XSS 수정 + openEdit/saveEdit
js/dashboard.js     ← XSS 수정
tests/storage.test.js   ← 신규: 단위 테스트
.github/workflows/ci.yml ← 신규: CI/CD 파이프라인
README.md           ← 신규: 프로젝트 문서
docs/PRD.md         ← 신규: 제품 요구사항 정의서
```

---

## 다음 스프린트 예고 (Sprint 2)

- F-11: 약품 선택 (마운자로/위고비/삭센다/오젬픽/기타)
- F-12: 목표 설정 & 진행률 (체중 목표, 주간 운동 목표, 칼로리 목표)
- 설정 페이지 추가 (헤더 ⚙️ 아이콘)
- 대시보드 목표 진행률 위젯
