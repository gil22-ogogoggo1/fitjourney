# 핏저니 (FitJourney)

> **"투약과 함께하는 건강한 변화"**
> GLP-1 투약자가 투약·체중·운동·식사를 한곳에서 기록하고 시각적으로 추적하는 개인 건강 관리 웹앱

🌐 **[라이브 데모](https://gil22-ogogogogo1.github.io/hellowrodl/)** | 📋 **[PRD](docs/PRD.md)**

---

## 문제 정의

GLP-1 계열 약품(마운자로·위고비·삭센다·오젬픽)을 투약 중인 사용자는 다음과 같은 어려움을 겪습니다:

- **투약 주기 관리**: 1주 간격 투약일을 매번 직접 계산해야 함
- **데이터 분산**: 투약 기록은 메모장, 체중은 헬스 앱, 식사는 다이어트 앱에 따로 저장
- **프라이버시 우려**: 건강 데이터를 클라우드 서버에 올리는 것에 대한 거부감
- **GLP-1 특화 기능 부재**: 기존 앱들은 약물 투약 주기 추적 기능이 없음

**핏저니**는 이 4가지 문제를 단일 앱으로 해결합니다.

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 💉 **투약 관리** | 투약일·용량·부위·부작용 기록, 다음 투약일 자동 계산 (D-Day 표시) |
| ⚖️ **체중·인바디** | 체중 추이 차트, 체지방·근육량·BMI 추적, 시작 대비 변화량 |
| 🏃 **운동 기록** | 런닝/웨이트/수영 등 종목별 세부 기록 (거리·페이스·세트·횟수) |
| 🥗 **식사 기록** | 끼니별 칼로리 합산, 일일 섭취량 요약 |
| ✏️ **전체 편집** | 모든 기록에 bottom-sheet 모달 기반 편집 기능 |
| 🔒 **완전한 프라이버시** | 서버 없음, 브라우저 LocalStorage에만 저장 |

---

## 기존 앱과의 차별점

| | 핏저니 | 삼성헬스 / Apple Health | MyFitnessPal / 다이어트 신 | 기타 GLP-1 앱 |
|---|---|---|---|---|
| GLP-1 투약 주기 추적 | ✅ | ❌ | ❌ | ✅ |
| 투약-체중-운동-식사 통합 | ✅ | △ (운동/체중만) | △ (식사/운동만) | ❌ (투약만) |
| 서버 없이 동작 (완전 오프라인) | ✅ | ❌ (클라우드 필수) | ❌ (클라우드 필수) | ❌ |
| 설치 불필요 (브라우저 실행) | ✅ | ❌ (앱 설치 필수) | ❌ (앱 설치 필수) | ❌ |
| 인바디 상세 데이터 (체지방·근육·내장지방) | ✅ | △ | ❌ | ❌ |
| 한국 GLP-1 약품 특화 | ✅ | ❌ | ❌ | △ |

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 언어 | 순수 HTML / CSS / JavaScript | 빌드 없음, 의존성 없음, 어디서나 즉시 실행 |
| 데이터 | 브라우저 LocalStorage | 서버 불필요, 완전한 오프라인 동작, 프라이버시 보장 |
| 차트 | Chart.js 4.x (CDN) | 경량(~200KB), 반응형 캔버스 차트, 추가 설정 불필요 |
| 디자인 | 모바일 우선 반응형, 다크 테마 | 한 손 조작 최적화, 320px~1920px 지원 |
| 테스트 | Jest + jsdom | LocalStorage 포함 브라우저 환경 단위 테스트 |
| CI/CD | GitHub Actions | 자동 테스트 + GitHub Pages 자동 배포 |

---

## 프로젝트 구조

```
fitjourney/
├── index.html              # SPA 진입점 (Chart.js CDN 포함)
├── css/
│   └── style.css           # 전역 스타일, CSS 변수, 다크 테마
├── js/
│   ├── storage.js          # LocalStorage CRUD + escapeHTML + 마이그레이션
│   ├── charts.js           # Chart.js 래퍼
│   ├── dashboard.js        # 대시보드 페이지
│   ├── mounjaro.js         # 투약 기록 페이지
│   ├── body.js             # 체중/인바디 기록 페이지
│   ├── exercise.js         # 운동 기록 페이지
│   ├── diet.js             # 식사 기록 페이지
│   └── app.js              # SPA 라우팅, 탭 네비, 공통 유틸
├── tests/
│   └── storage.test.js     # Storage 단위 테스트 (Jest)
├── docs/
│   ├── PRD.md              # 제품 요구사항 정의서
│   └── sprint/
│       └── sprint1.md      # Sprint 1 진행 기록
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CD 파이프라인 (테스트 + 배포)
├── CLAUDE.md               # AI 컨텍스트 파일
├── package.json            # Jest 테스트 설정
└── jest.config.js          # Jest 환경 설정
```

**JS 로드 순서**: `storage.js` → `charts.js` → 각 페이지 모듈 → `app.js`

---

## 빠른 시작

### 로컬 실행 (서버 불필요)
```bash
git clone https://github.com/gil22-ogogogogo1/hellowrodl.git
cd hellowrodl
# index.html을 브라우저에서 직접 열기
open index.html   # macOS
start index.html  # Windows
```

### 테스트 실행
```bash
npm install
npm test           # 단위 테스트 + 커버리지
```

---

## 개발 현황

| Sprint | 상태 | 주요 내용 |
|--------|------|----------|
| Sprint 1 | ✅ 완료 | 리브랜딩, XSS 수정, 마이그레이션, 전체 편집 기능 |
| Sprint 2 | ⬜ 예정 | 약품 선택, 목표 설정 & 진행률, 설정 페이지 |
| Sprint 3 | ⬜ 예정 | 차트/통계 강화 (운동 빈도, 칼로리 추이) |
| Sprint 4 | ⬜ 예정 | 데이터 내보내기/가져오기, 마일스톤 |
| Sprint 5 | ⬜ 예정 | 다크/라이트 테마 전환, 데스크톱 레이아웃 |
| Sprint 6 | ⬜ 예정 | 접근성, 안정화, 전체 QA |

---

## LocalStorage 스키마

| 키 | 타입 | 설명 |
|----|------|------|
| `mj_mounjaro` | `Record[]` | 투약 기록 |
| `mj_body`     | `Record[]` | 체중/인바디 기록 |
| `mj_exercise` | `Record[]` | 운동 기록 |
| `mj_diet`     | `Record[]` | 식사 기록 |
| `mj_version`  | `string`   | 스키마 버전 (마이그레이션 관리) |

> ⚠️ **키 이름 변경 금지**: 기존 사용자 데이터 유실. 변경 필요 시 `storage.js`의 `migrate()` 활용.

---

## 보안

- 모든 사용자 입력은 `escapeHTML()`로 처리 (XSS 방지)
- 데이터는 사용자 기기 로컬에만 저장 (서버 전송 없음)
- 외부 의존성: Chart.js CDN (jsDelivr) + Google Fonts만 사용

---

## 라이선스

MIT License
