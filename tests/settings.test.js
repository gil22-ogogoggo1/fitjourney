/**
 * tests/settings.test.js
 * Goals, AppSettings, Milestones 단위 테스트
 */

// settings.js는 Storage에 의존 — 간단한 스텁 제공
const { Storage, escapeHTML, migrate, KEYS } = require('../js/storage');

// Storage를 전역으로 노출 (settings.js가 전역 참조)
global.Storage = Storage;
global.KEYS = KEYS;

const { Goals, AppSettings, Milestones } = require('../js/settings');

beforeEach(() => {
  localStorage.clear();
});

// ────────────────────────────────────────
// Goals
// ────────────────────────────────────────
describe('Goals', () => {
  test('초기 상태는 빈 객체 반환', () => {
    expect(Goals.get()).toEqual({});
  });

  test('save 후 get으로 조회 가능', () => {
    Goals.save({ weightStart: 85, weightTarget: 70 });
    const g = Goals.get();
    expect(g.weightStart).toBe(85);
    expect(g.weightTarget).toBe(70);
  });

  test('save 시 기존 필드 유지 (partial update)', () => {
    Goals.save({ weightStart: 85, weightTarget: 70 });
    Goals.save({ exerciseWeekly: 3 });
    const g = Goals.get();
    expect(g.weightStart).toBe(85);
    expect(g.exerciseWeekly).toBe(3);
  });

  test('localStorage 손상 시 빈 객체 반환', () => {
    // mj_current_user 없으면 'default' 사용
    localStorage.setItem('mj_default_goals', 'INVALID_JSON{{{');
    expect(() => Goals.get()).not.toThrow();
    expect(Goals.get()).toEqual({});
  });

  test('사용자별 키 분리 — user1 저장 후 user2에서 빈 객체', () => {
    localStorage.setItem('mj_current_user', 'user1');
    Goals.save({ weightTarget: 65 });

    localStorage.setItem('mj_current_user', 'user2');
    expect(Goals.get()).toEqual({});
  });

  test('사용자별 키 분리 — user1 데이터가 user2에 영향 없음', () => {
    localStorage.setItem('mj_current_user', 'user1');
    Goals.save({ weightTarget: 65 });

    localStorage.setItem('mj_current_user', 'user2');
    Goals.save({ weightTarget: 80 });

    localStorage.setItem('mj_current_user', 'user1');
    expect(Goals.get().weightTarget).toBe(65);
  });
});

// ────────────────────────────────────────
// AppSettings
// ────────────────────────────────────────
describe('AppSettings', () => {
  test('초기 상태는 빈 객체 반환', () => {
    expect(AppSettings.get()).toEqual({});
  });

  test('save 후 get으로 조회 가능', () => {
    AppSettings.save({ theme: 'light' });
    expect(AppSettings.get().theme).toBe('light');
  });

  test('save 시 기존 필드 유지', () => {
    AppSettings.save({ theme: 'dark' });
    AppSettings.save({ lang: 'ko' });
    const s = AppSettings.get();
    expect(s.theme).toBe('dark');
    expect(s.lang).toBe('ko');
  });

  test('localStorage 손상 시 빈 객체 반환', () => {
    localStorage.setItem('mj_settings', 'BAD_JSON{');
    expect(() => AppSettings.get()).not.toThrow();
    expect(AppSettings.get()).toEqual({});
  });

  test('applyTheme() — data-theme 속성이 설정됨 (dark 기본값)', () => {
    AppSettings.applyTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('applyTheme() — light 테마 저장 후 적용', () => {
    AppSettings.save({ theme: 'light' });
    AppSettings.applyTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('applyTheme() — 설정 없으면 dark 기본 적용', () => {
    AppSettings.applyTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

// ────────────────────────────────────────
// Milestones
// ────────────────────────────────────────
describe('Milestones', () => {
  test('체중 기록 1개 이하이면 빈 배열 반환', () => {
    Storage.add('body', { date: '2026-01-01', weight: 85 });
    expect(Milestones.achieved()).toEqual([]);
  });

  test('체중 기록 없으면 빈 배열 반환', () => {
    expect(Milestones.achieved()).toEqual([]);
  });

  test('2kg 감량 시 첫 번째 마일스톤 달성', () => {
    Storage.add('body', { date: '2026-01-01', weight: 85 });
    Storage.add('body', { date: '2026-01-15', weight: 82.5 });
    const badges = Milestones.achieved();
    expect(badges.length).toBe(1);
    expect(badges[0].kg).toBe(2);
  });

  test('5kg 감량 시 2개 마일스톤 달성 (2kg + 5kg)', () => {
    Storage.add('body', { date: '2026-01-01', weight: 85 });
    Storage.add('body', { date: '2026-02-01', weight: 80 });
    const badges = Milestones.achieved();
    expect(badges.length).toBe(2);
    expect(badges.map(b => b.kg)).toEqual([2, 5]);
  });

  test('10kg 감량 시 3개 마일스톤 달성', () => {
    Storage.add('body', { date: '2026-01-01', weight: 90 });
    Storage.add('body', { date: '2026-03-01', weight: 80 });
    const badges = Milestones.achieved();
    expect(badges.length).toBe(3);
    expect(badges.map(b => b.kg)).toEqual([2, 5, 10]);
  });

  test('20kg 감량 시 5개 마일스톤 모두 달성', () => {
    Storage.add('body', { date: '2026-01-01', weight: 100 });
    Storage.add('body', { date: '2026-06-01', weight: 80 });
    const badges = Milestones.achieved();
    expect(badges.length).toBe(5);
  });

  test('goals.weightStart 설정 시 해당 값 기준으로 계산', () => {
    Goals.save({ weightStart: 90 });
    // 기록상 시작은 85지만 goals.weightStart=90 기준
    Storage.add('body', { date: '2026-01-01', weight: 85 });
    Storage.add('body', { date: '2026-03-01', weight: 82 });
    // 90 - 82 = 8kg 감량 → 2kg, 5kg 달성
    const badges = Milestones.achieved();
    expect(badges.length).toBe(2);
  });

  test('감량 없거나 증가 시 빈 배열 반환', () => {
    Storage.add('body', { date: '2026-01-01', weight: 75 });
    Storage.add('body', { date: '2026-02-01', weight: 76 });
    expect(Milestones.achieved()).toEqual([]);
  });

  test('마일스톤 뱃지에 emoji와 label이 포함됨', () => {
    Storage.add('body', { date: '2026-01-01', weight: 85 });
    Storage.add('body', { date: '2026-02-01', weight: 82 });
    const badges = Milestones.achieved();
    expect(badges[0].emoji).toBeDefined();
    expect(badges[0].label).toBeDefined();
  });
});
