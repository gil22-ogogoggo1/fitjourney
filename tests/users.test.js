/**
 * tests/users.test.js
 * Users 다중 사용자 모듈 단위 테스트
 */

const { Users } = require('../js/users');

beforeEach(() => {
  localStorage.clear();
});

// ────────────────────────────────────────
// Users.add
// ────────────────────────────────────────
describe('Users.add()', () => {
  test('새 사용자 추가 시 id, name, color, createdAt 포함', () => {
    const user = Users.add('김민지');
    expect(user.id).toBeDefined();
    expect(user.name).toBe('김민지');
    expect(user.color).toBeDefined();
    expect(user.createdAt).toBeDefined();
  });

  test('앞뒤 공백이 trim 처리됨', () => {
    const user = Users.add('  이준호  ');
    expect(user.name).toBe('이준호');
  });

  test('추가 후 getAll()에서 확인 가능', () => {
    Users.add('박서연');
    expect(Users.getAll()).toHaveLength(1);
  });

  test('여러 사용자 추가 시 각각 다른 색상 할당', () => {
    const u1 = Users.add('사용자1');
    const u2 = Users.add('사용자2');
    const u3 = Users.add('사용자3');
    // 색상 배열 순환 — 최소한 첫 두 명은 다른 색
    expect(u1.color).not.toBe(u2.color);
    expect(u2.color).not.toBe(u3.color);
  });

  test('localStorage에 사용자 목록이 저장됨', () => {
    Users.add('테스트');
    const raw = JSON.parse(localStorage.getItem('mj_users'));
    expect(raw).toHaveLength(1);
    expect(raw[0].name).toBe('테스트');
  });
});

// ────────────────────────────────────────
// Users.switchTo / getCurrentId / getCurrent
// ────────────────────────────────────────
describe('Users.switchTo()', () => {
  test('switchTo 후 getCurrentId가 해당 id 반환', () => {
    const user = Users.add('나');
    Users.switchTo(user.id);
    expect(Users.getCurrentId()).toBe(user.id);
  });

  test('getCurrent()가 현재 사용자 객체 반환', () => {
    const user = Users.add('홍길동');
    Users.switchTo(user.id);
    const cur = Users.getCurrent();
    expect(cur).not.toBeNull();
    expect(cur.name).toBe('홍길동');
  });

  test('사용자 전환 후 getCurrent()가 새 사용자 반환', () => {
    const u1 = Users.add('사용자A');
    const u2 = Users.add('사용자B');
    Users.switchTo(u1.id);
    expect(Users.getCurrent().name).toBe('사용자A');
    Users.switchTo(u2.id);
    expect(Users.getCurrent().name).toBe('사용자B');
  });

  test('사용자 미설정 시 getCurrentId()가 null 반환', () => {
    expect(Users.getCurrentId()).toBeNull();
  });
});

// ────────────────────────────────────────
// Users.rename
// ────────────────────────────────────────
describe('Users.rename()', () => {
  test('이름 변경 후 getAll()에 반영됨', () => {
    const user = Users.add('원래이름');
    Users.rename(user.id, '새이름');
    const updated = Users.getAll().find(u => u.id === user.id);
    expect(updated.name).toBe('새이름');
  });

  test('앞뒤 공백이 trim 처리됨', () => {
    const user = Users.add('이름');
    Users.rename(user.id, '  변경된이름  ');
    const updated = Users.getAll().find(u => u.id === user.id);
    expect(updated.name).toBe('변경된이름');
  });

  test('존재하지 않는 id rename은 에러 없이 무시', () => {
    expect(() => Users.rename('nonexistent', '이름')).not.toThrow();
  });
});

// ────────────────────────────────────────
// Users.remove
// ────────────────────────────────────────
describe('Users.remove()', () => {
  test('삭제 후 getAll()에서 제거됨', () => {
    const user = Users.add('삭제대상');
    Users.add('다른사용자');
    Users.switchTo(user.id);
    Users.remove(user.id);
    expect(Users.getAll().find(u => u.id === user.id)).toBeUndefined();
  });

  test('삭제된 사용자의 데이터가 localStorage에서 제거됨', () => {
    const user = Users.add('삭제대상');
    // 해당 사용자 데이터 세팅
    localStorage.setItem(`mj_${user.id}_mounjaro`, JSON.stringify([{ id: '1' }]));
    localStorage.setItem(`mj_${user.id}_body`, JSON.stringify([{ id: '2' }]));

    Users.add('남은사용자');
    Users.switchTo(user.id);
    Users.remove(user.id);

    expect(localStorage.getItem(`mj_${user.id}_mounjaro`)).toBeNull();
    expect(localStorage.getItem(`mj_${user.id}_body`)).toBeNull();
  });

  test('현재 사용자 삭제 시 다른 사용자로 자동 전환', () => {
    const u1 = Users.add('현재사용자');
    const u2 = Users.add('남은사용자');
    Users.switchTo(u1.id);
    Users.remove(u1.id);
    expect(Users.getCurrentId()).toBe(u2.id);
  });

  test('다른 사용자 데이터는 유지됨', () => {
    const u1 = Users.add('삭제대상');
    const u2 = Users.add('유지사용자');
    localStorage.setItem(`mj_${u2.id}_mounjaro`, JSON.stringify([{ id: '99' }]));
    Users.switchTo(u1.id);
    Users.remove(u1.id);
    expect(localStorage.getItem(`mj_${u2.id}_mounjaro`)).not.toBeNull();
  });
});

// ────────────────────────────────────────
// Users.init — 앱 초기화 및 마이그레이션
// ────────────────────────────────────────
describe('Users.init()', () => {
  test('사용자 없으면 "나" 기본 사용자 자동 생성', () => {
    Users.init();
    const users = Users.getAll();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('나');
  });

  test('초기화 후 현재 사용자 자동 설정됨', () => {
    Users.init();
    expect(Users.getCurrentId()).not.toBeNull();
    expect(Users.getCurrent()).not.toBeNull();
  });

  test('구버전 데이터(mj_mounjaro) 존재 시 "기본 사용자"로 마이그레이션', () => {
    localStorage.setItem('mj_mounjaro', JSON.stringify([{ id: '1', dose: '5mg' }]));
    Users.init();
    const users = Users.getAll();
    expect(users[0].name).toBe('기본 사용자');
  });

  test('구버전 데이터가 새 사용자 키로 이전됨', () => {
    const oldData = [{ id: '1', dose: '5mg' }];
    localStorage.setItem('mj_mounjaro', JSON.stringify(oldData));
    Users.init();
    const userId = Users.getCurrentId();
    const migrated = JSON.parse(localStorage.getItem(`mj_${userId}_mounjaro`));
    expect(migrated).toEqual(oldData);
    // 구버전 키는 삭제됨
    expect(localStorage.getItem('mj_mounjaro')).toBeNull();
  });

  test('이미 사용자가 있으면 중복 생성 안 함', () => {
    Users.init(); // 최초 초기화
    Users.init(); // 재호출
    expect(Users.getAll()).toHaveLength(1);
  });

  test('현재 사용자 id가 유효하지 않으면 첫 번째 사용자로 재설정', () => {
    Users.add('첫번째');
    localStorage.setItem('mj_current_user', 'nonexistent_id');
    Users.init();
    expect(Users.getCurrent()).not.toBeNull();
    expect(Users.getCurrent().name).toBe('첫번째');
  });
});
