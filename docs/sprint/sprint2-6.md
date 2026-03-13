# Sprint 2~6: 핏저니 전체 기능 완성

- **기간**: 2026-03-13
- **브랜치**: master
- **상태**: ✅ 완료

---

## Sprint 2: 약품 선택 & 목표 설정 & 설정 페이지

### 구현 내용

**약품 선택 (F-11) — `js/mounjaro.js`**
- 5종 약품 선택: 마운자로·위고비·삭센다·오젬픽·기타
- 약품별 용량 범위 자동 변경 (`updateDoses()`)
- 약품별 투약 간격 자동 적용 (삭센다 1일, 나머지 7일)
- 기록 목록·대시보드에 약품 컬러 뱃지 표시
- 기존 drugName 없는 레코드 하위 호환 처리

**목표 설정 & 진행률 (F-12) — `js/settings.js`, `js/dashboard.js`**
- `Goals` 객체: 사용자별 목표 저장 (`mj_{userId}_goals`)
- 목표 항목: 시작 체중·목표 체중·주간 운동 횟수·일일 칼로리
- 대시보드 진행률 위젯: orange/green/blue progress bar

**설정 페이지 — `js/settings.js`**
- 헤더 ⚙️ 버튼 → 설정 페이지 (가상 페이지, 탭 5개 유지)
- 목표 설정 폼, 테마 선택, 데이터 백업/복원

**다중 사용자 — `js/users.js`**
- `Users` 모듈: 등록·전환·이름변경·삭제
- 데이터 분리: `mj_{userId}_{store}` 키 패턴
- `KEYS` ES6 getter로 현재 사용자 ID 동적 반영
- 기존 `mj_mounjaro` 데이터 자동 마이그레이션

### 주요 변경 파일
```
js/settings.js      ← 신규: Goals, AppSettings, DataIO, Milestones, SettingsPage
js/users.js         ← 신규: 다중 사용자 관리
js/storage.js       ← KEYS → ES6 getter, migrate() 자동호출 제거
js/profile.js       ← KEY → 사용자별 getter
js/mounjaro.js      ← DRUGS 객체, updateDoses(), 약품 뱃지
js/dashboard.js     ← _renderGoalProgress(), 투약 카드 약품 정보 추가
js/app.js           ← settings 가상 페이지, ⚙️ 버튼, 사용자 모달
css/style.css       ← .drug-badge, .goal-item, .progress-track, .progress-bar
                    ← .theme-btn, .user-avatar-btn, 사용자 모달 스타일
fitjourney.html     ← users.js, settings.js script 태그 추가
```

---

## Sprint 3: 차트/통계 강화

### 구현 내용

**체중 기간 필터 — `js/body.js`**
- [전체] [3달] [1달] [1주] 버튼으로 차트 데이터 필터링
- `setChartPeriod(period, btn)` 메서드

**체성분 듀얼 라인 차트 — `js/body.js`, `js/charts.js`**
- 체지방률(빨강) + 골격근량(초록) 동시 표시
- `Charts.renderBodyCompChart()`

**운동 빈도 막대 차트 — `js/exercise.js`, `js/charts.js`**
- 최근 8주 주간 운동 횟수 집계
- `Charts.renderExerciseFreqChart()`

**칼로리 추이 막대 차트 — `js/diet.js`, `js/charts.js`**
- 최근 14일 일별 칼로리 합산
- `Charts.renderCalorieTrendChart()`

**Chart.js graceful fallback — `js/charts.js`**
- `_guard()` 메서드: Chart 미정의 시 안내 메시지 표시
- 모든 renderXxx 메서드에 적용

### 주요 변경 파일
```
js/charts.js        ← renderBodyCompChart, renderExerciseFreqChart,
                       renderCalorieTrendChart, _guard(), _destroy()
js/body.js          ← setChartPeriod(), renderCompChart(), 기간 필터 버튼 UI
js/exercise.js      ← renderFreqChart(), 빈도 차트 카드
js/diet.js          ← renderCalChart(), 칼로리 차트 카드
css/style.css       ← .chart-filter-group, .chart-filter-btn
```

---

## Sprint 4: 마일스톤 & 데이터 백업 & 주간 리포트

### 구현 내용

**마일스톤 자동 감지 (F-13) — `js/settings.js`, `js/dashboard.js`**
- `Milestones.achieved()`: 시작 체중 대비 감량량으로 뱃지 자동 계산
- 감량 구간: 2·5·10·15·20kg
- 대시보드 마일스톤 카드로 표시

**이번 주 요약 카드 (F-17) — `js/dashboard.js`**
- 월요일 기준 이번 주 운동 횟수, 평균 칼로리, 체중 변화

**JSON 백업/복원 (F-15) — `js/settings.js`**
- `DataIO.exportAll()`: 현재 사용자의 전체 데이터 JSON 다운로드
- `DataIO.importAll(file)`: JSON 파일에서 데이터 복원
- 백업 파일명: `fitjourney_{userId}_{date}.json`

### 주요 변경 파일
```
js/settings.js      ← DataIO.exportAll/importAll, Milestones 클래스
js/dashboard.js     ← _renderMilestones(), _renderWeeklyReport()
css/style.css       ← .milestone-badge
```

---

## Sprint 5: 테마 & 데스크톱 레이아웃

### 구현 내용

**다크/라이트 테마 (F-16) — `css/style.css`, `js/settings.js`**
- `:root` 기본값 = 다크 테마
- `[data-theme="light"]` 라이트 테마 CSS 변수 세트
- `AppSettings.applyTheme()`: 저장된 테마 앱 시작 시 즉시 적용
- 설정 페이지 테마 버튼으로 즉시 전환

**데스크톱 레이아웃 (F-18) — `css/style.css`**
- `@media (min-width: 768px)`: 2컬럼 대시보드 그리드, 여백 확대
- `@media (min-width: 1024px)`: 좌측 220px 사이드바 네비, 우측 콘텐츠 영역

### 주요 변경 파일
```
css/style.css       ← [data-theme="light"] 변수, @media 768px, @media 1024px
js/settings.js      ← AppSettings.save/applyTheme, SettingsPage.setTheme()
js/app.js           ← init() → AppSettings.applyTheme() 호출 추가
```

---

## Sprint 6: 접근성 & 안정화

### 구현 내용

**ARIA 접근성 — `js/app.js`**
- `#tab-nav`: `role="navigation"` `aria-label="메인 메뉴"`
- 각 탭 버튼: `aria-label` 추가
- 헤더 아이콘 버튼: `aria-label` 추가
- 이모지 아이콘: `aria-hidden="true"` 처리

**상단 탭 네비 이동 — `js/app.js`, `css/style.css`**
- 기존 하단 `position: fixed` 탭 → 헤더 아래 상단 탭
- 탭 버튼 스타일: 세로(아이콘+텍스트) → 가로(이모지+텍스트), 오렌지 언더라인
- `padding-bottom` 에서 탭 높이 여백 제거

### 검증 체크리스트

- ✅ 상단 탭 전환 및 활성 상태 표시
- ✅ 설정 페이지 목표 저장 → 대시보드 진행률 반영
- ✅ 사용자 추가/전환/삭제 후 데이터 분리 확인
- ✅ JSON 백업 다운로드 → 복원 데이터 일치 확인
- ✅ 마일스톤 뱃지 자동 감지
- ✅ 라이트 테마 전환 후 새로고침 시 유지 확인
- ✅ 체중 차트 기간 필터 작동 확인
- ✅ 운동 빈도/칼로리 추이 차트 렌더 확인
- ✅ 데스크톱(1024px+) 사이드바 레이아웃 확인
- ✅ 오프라인 시 Chart.js fallback 메시지 확인

### 주요 변경 파일
```
js/app.js           ← ARIA 속성, 탭 DOM 순서 변경(nav를 container 앞으로)
css/style.css       ← #tab-nav: fixed → flex-shrink:0 상단 배치
                    ← .tab-btn: 가로 레이아웃, 언더라인 active 스타일
                    ← --tab-h: 64px → 44px
                    ← padding-bottom: tab 여백 제거
```

---

## 전체 구현 완료 파일 목록

| 파일 | 역할 |
|------|------|
| `fitjourney.html` | SPA 진입점 (12개 JS 모듈 로드) |
| `js/storage.js` | CRUD + escapeHTML + migrate (KEYS getter) |
| `js/users.js` | 다중 사용자 관리 |
| `js/charts.js` | 5종 차트 + graceful fallback |
| `js/profile.js` | 사용자 프로필 + 또래 평균 |
| `js/sync.js` | 삼성헬스 연동 + 블루투스 |
| `js/mounjaro.js` | GLP-1 투약 기록 (4종 약품) |
| `js/body.js` | 체중 기록 (기간 필터, 체성분 차트) |
| `js/exercise.js` | 운동 기록 (빈도 차트) |
| `js/diet.js` | 식사 기록 (칼로리 추이) |
| `js/dashboard.js` | 목표 진행률·마일스톤·주간 요약 |
| `js/settings.js` | 목표·테마·백업·마일스톤 |
| `js/app.js` | SPA 라우팅·상단 탭·사용자 모달 |
| `css/style.css` | 다크/라이트 테마·반응형·컴포넌트 |
| `tests/storage.test.js` | 35개 단위 테스트 |
| `.github/workflows/ci.yml` | CI/CD 파이프라인 |
