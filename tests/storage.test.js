/**
 * tests/storage.test.js
 * Storage 유틸리티 단위 테스트
 */

const { Storage, escapeHTML, migrate, KEYS, SCHEMA_VERSION } = require('../js/storage');

// ────────────────────────────────────────
// escapeHTML — XSS 방지 유틸
// ────────────────────────────────────────
describe('escapeHTML()', () => {
  test('스크립트 태그를 이스케이프 처리', () => {
    expect(escapeHTML('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  test('앰퍼샌드(&) 이스케이프', () => {
    expect(escapeHTML('A & B')).toBe('A &amp; B');
  });

  test('큰따옴표 이스케이프', () => {
    expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;');
  });

  test('작은따옴표 이스케이프', () => {
    expect(escapeHTML("'world'")).toBe('&#039;world&#039;');
  });

  test('꺾쇠 괄호 이스케이프', () => {
    expect(escapeHTML('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;');
  });

  test('빈 문자열은 빈 문자열 반환', () => {
    expect(escapeHTML('')).toBe('');
  });

  test('null은 빈 문자열 반환', () => {
    expect(escapeHTML(null)).toBe('');
  });

  test('undefined는 빈 문자열 반환', () => {
    expect(escapeHTML(undefined)).toBe('');
  });

  test('일반 한국어 텍스트는 그대로 반환', () => {
    expect(escapeHTML('안녕하세요 핏저니')).toBe('안녕하세요 핏저니');
  });

  test('복합 XSS 공격 패턴 이스케이프', () => {
    const input = '<img src=x onerror="alert(\'xss\')">';
    const output = escapeHTML(input);
    expect(output).not.toContain('<img');
    expect(output).not.toContain('<');
  });
});

// ────────────────────────────────────────
// Storage.add
// ────────────────────────────────────────
describe('Storage.add()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('레코드 추가 시 id(timestamp)가 자동 생성됨', () => {
    const record = Storage.add('mounjaro', { date: '2026-01-01', dose: '5mg', site: '복부' });
    expect(record.id).toBeDefined();
    expect(typeof record.id).toBe('string');
  });

  test('레코드 추가 시 createdAt(ISO)이 자동 생성됨', () => {
    const record = Storage.add('mounjaro', { date: '2026-01-01', dose: '5mg', site: '복부' });
    expect(record.createdAt).toBeDefined();
    expect(() => new Date(record.createdAt)).not.toThrow();
  });

  test('입력한 필드가 레코드에 포함됨', () => {
    const record = Storage.add('body', { date: '2026-01-01', weight: 75.3 });
    expect(record.date).toBe('2026-01-01');
    expect(record.weight).toBe(75.3);
  });

  test('추가된 레코드가 localStorage에 저장됨', () => {
    Storage.add('body', { date: '2026-01-01', weight: 75.3 });
    const raw = JSON.parse(localStorage.getItem(KEYS.body));
    expect(raw).toHaveLength(1);
    expect(raw[0].weight).toBe(75.3);
  });

  test('여러 레코드를 순차적으로 추가 가능', () => {
    Storage.add('exercise', { date: '2026-01-01', type: '런닝' });
    Storage.add('exercise', { date: '2026-01-02', type: '웨이트' });
    Storage.add('exercise', { date: '2026-01-03', type: '수영' });
    expect(Storage.getAll('exercise')).toHaveLength(3);
  });

  test('추가된 레코드 반환값이 저장된 값과 일치', () => {
    const returned = Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '닭가슴살' });
    const stored = Storage.getById('diet', returned.id);
    expect(stored).toEqual(returned);
  });
});

// ────────────────────────────────────────
// Storage.getAll
// ────────────────────────────────────────
describe('Storage.getAll()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('빈 스토어는 빈 배열 반환', () => {
    expect(Storage.getAll('mounjaro')).toEqual([]);
  });

  test('날짜 내림차순(최신순)으로 정렬', () => {
    Storage.add('body', { date: '2026-01-01', weight: 80 });
    Storage.add('body', { date: '2026-01-10', weight: 78 });
    Storage.add('body', { date: '2026-01-05', weight: 79 });

    const all = Storage.getAll('body');
    expect(all[0].date).toBe('2026-01-10');
    expect(all[1].date).toBe('2026-01-05');
    expect(all[2].date).toBe('2026-01-01');
  });

  test('localStorage 손상 시 빈 배열 반환 (에러 없이 graceful 처리)', () => {
    localStorage.setItem(KEYS.mounjaro, 'invalid_json{{{');
    expect(() => Storage.getAll('mounjaro')).not.toThrow();
    expect(Storage.getAll('mounjaro')).toEqual([]);
  });
});

// ────────────────────────────────────────
// Storage.update
// ────────────────────────────────────────
describe('Storage.update()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('기존 레코드의 필드를 수정', () => {
    const record = Storage.add('body', { date: '2026-01-01', weight: 80 });
    const updated = Storage.update('body', record.id, { weight: 79.5 });
    expect(updated.weight).toBe(79.5);
  });

  test('수정 시 updatedAt 타임스탬프가 추가됨', () => {
    const record = Storage.add('body', { date: '2026-01-01', weight: 80 });
    const updated = Storage.update('body', record.id, { weight: 79 });
    expect(updated.updatedAt).toBeDefined();
  });

  test('수정하지 않은 기존 필드는 그대로 유지', () => {
    const record = Storage.add('body', { date: '2026-01-01', weight: 80, memo: '운동 후 측정' });
    Storage.update('body', record.id, { weight: 79 });
    const after = Storage.getById('body', record.id);
    expect(after.memo).toBe('운동 후 측정');
    expect(after.date).toBe('2026-01-01');
  });

  test('존재하지 않는 id 수정 시 null 반환', () => {
    const result = Storage.update('body', 'nonexistent_id', { weight: 70 });
    expect(result).toBeNull();
  });

  test('수정 후 localStorage에 올바르게 저장됨', () => {
    const record = Storage.add('mounjaro', { date: '2026-01-01', dose: '5mg', site: '복부' });
    Storage.update('mounjaro', record.id, { dose: '7.5mg' });
    const stored = Storage.getById('mounjaro', record.id);
    expect(stored.dose).toBe('7.5mg');
  });
});

// ────────────────────────────────────────
// Storage.remove
// ────────────────────────────────────────
describe('Storage.remove()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('지정한 id의 레코드를 삭제', () => {
    const record = Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '테스트' });
    Storage.remove('diet', record.id);
    expect(Storage.getAll('diet')).toHaveLength(0);
  });

  test('삭제 후 다른 레코드는 유지됨', () => {
    const r1 = Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '아침 식사' });
    const r2 = Storage.add('diet', { date: '2026-01-01', meal: '점심', content: '점심 식사' });
    Storage.remove('diet', r1.id);
    const remaining = Storage.getAll('diet');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(r2.id);
  });

  test('존재하지 않는 id 삭제 시 에러 없이 처리', () => {
    Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '테스트' });
    expect(() => Storage.remove('diet', 'nonexistent_id')).not.toThrow();
    expect(Storage.getAll('diet')).toHaveLength(1);
  });
});

// ────────────────────────────────────────
// Storage.getById
// ────────────────────────────────────────
describe('Storage.getById()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('id로 특정 레코드 조회', () => {
    const record = Storage.add('mounjaro', { date: '2026-01-01', dose: '5mg', site: '복부' });
    const found = Storage.getById('mounjaro', record.id);
    expect(found).not.toBeNull();
    expect(found.id).toBe(record.id);
    expect(found.dose).toBe('5mg');
  });

  test('존재하지 않는 id는 null 반환', () => {
    expect(Storage.getById('mounjaro', 'nonexistent')).toBeNull();
  });

  test('빈 스토어에서 조회 시 null 반환', () => {
    expect(Storage.getById('body', 'any_id')).toBeNull();
  });
});

// ────────────────────────────────────────
// Storage.getRecent
// ────────────────────────────────────────
describe('Storage.getRecent()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('기본값(n=5)으로 최신 5건 반환', () => {
    for (let i = 1; i <= 10; i++) {
      Storage.add('exercise', {
        date: `2026-01-${String(i).padStart(2, '0')}`,
        type: '런닝',
      });
    }
    expect(Storage.getRecent('exercise')).toHaveLength(5);
  });

  test('n=3 지정 시 최신 3건만 반환', () => {
    for (let i = 1; i <= 7; i++) {
      Storage.add('body', { date: `2026-01-${String(i).padStart(2, '0')}`, weight: 80 - i });
    }
    const recent = Storage.getRecent('body', 3);
    expect(recent).toHaveLength(3);
    // 가장 최근 날짜(1월 7일)부터 반환되어야 함
    expect(recent[0].date).toBe('2026-01-07');
  });

  test('전체 레코드 수가 n보다 적으면 전체 반환', () => {
    Storage.add('diet', { date: '2026-01-01', meal: '아침', content: '테스트' });
    Storage.add('diet', { date: '2026-01-02', meal: '점심', content: '테스트' });
    expect(Storage.getRecent('diet', 10)).toHaveLength(2);
  });
});

// ────────────────────────────────────────
// migrate — 스키마 마이그레이션
// ────────────────────────────────────────
describe('migrate()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('마이그레이션 완료 후 mj_version이 SCHEMA_VERSION으로 설정됨', () => {
    migrate();
    expect(localStorage.getItem('mj_version')).toBe(String(SCHEMA_VERSION));
  });

  test('기존 mounjaro 기록에 drugName 기본값(mounjaro) 추가', () => {
    // 마이그레이션 이전 데이터 시뮬레이션 (drugName 없음)
    localStorage.setItem('mj_version', '0');
    localStorage.setItem(
      KEYS.mounjaro,
      JSON.stringify([
        { id: '1', date: '2026-01-01', dose: '5mg', site: '복부' },
        { id: '2', date: '2026-01-08', dose: '7.5mg', site: '복부' },
      ])
    );

    migrate();

    const records = JSON.parse(localStorage.getItem(KEYS.mounjaro));
    expect(records[0].drugName).toBe('mounjaro');
    expect(records[1].drugName).toBe('mounjaro');
  });

  test('이미 drugName이 있는 레코드는 덮어쓰지 않음', () => {
    localStorage.setItem('mj_version', '0');
    localStorage.setItem(
      KEYS.mounjaro,
      JSON.stringify([
        { id: '1', date: '2026-01-01', dose: '5mg', drugName: 'wegovy' },
      ])
    );

    migrate();

    const records = JSON.parse(localStorage.getItem(KEYS.mounjaro));
    expect(records[0].drugName).toBe('wegovy');
  });

  test('이미 최신 버전이면 마이그레이션 재실행 안 함', () => {
    localStorage.setItem('mj_version', String(SCHEMA_VERSION));
    // 손상된 데이터 상태에서도 재실행하지 않아야 함
    localStorage.setItem(KEYS.mounjaro, 'corrupted_data');

    // 재실행 시에도 예외 없어야 함
    expect(() => migrate()).not.toThrow();
  });
});

// ────────────────────────────────────────
// KEYS 상수 검증 (동적 getter — 사용자 ID 반영)
// ────────────────────────────────────────
describe('KEYS 상수', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('사용자 미설정 시 default 접두사 사용', () => {
    expect(KEYS.mounjaro).toBe('mj_default_mounjaro');
    expect(KEYS.body).toBe('mj_default_body');
    expect(KEYS.exercise).toBe('mj_default_exercise');
    expect(KEYS.diet).toBe('mj_default_diet');
  });

  test('사용자 설정 시 해당 사용자 ID 접두사 사용', () => {
    localStorage.setItem('mj_current_user', 'user123');
    expect(KEYS.mounjaro).toBe('mj_user123_mounjaro');
    expect(KEYS.body).toBe('mj_user123_body');
    expect(KEYS.exercise).toBe('mj_user123_exercise');
    expect(KEYS.diet).toBe('mj_user123_diet');
  });
});
