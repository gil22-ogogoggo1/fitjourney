/**
 * storage.js — LocalStorage CRUD 유틸리티
 */

// ── XSS 방지 유틸 ──
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// KEYS는 ES6 getter로 현재 사용자 ID를 동적으로 반영
const KEYS = {
  get mounjaro() { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_mounjaro`; },
  get body()     { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_body`; },
  get exercise() { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_exercise`; },
  get diet()     { return `mj_${localStorage.getItem('mj_current_user') || 'default'}_diet`; },
};

const Storage = {
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  },

  _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // 전체 조회 (날짜 내림차순)
  getAll(store) {
    const items = this._get(KEYS[store]);
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // 단건 추가 (id 자동 생성)
  add(store, record) {
    const items = this._get(KEYS[store]);
    const newRecord = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...record,
    };
    items.push(newRecord);
    this._set(KEYS[store], items);
    return newRecord;
  },

  // 단건 수정
  update(store, id, changes) {
    const items = this._get(KEYS[store]);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...changes, updatedAt: new Date().toISOString() };
    this._set(KEYS[store], items);
    return items[idx];
  },

  // 단건 삭제
  remove(store, id) {
    const items = this._get(KEYS[store]);
    const filtered = items.filter(i => i.id !== id);
    this._set(KEYS[store], filtered);
  },

  // id로 단건 조회
  getById(store, id) {
    const items = this._get(KEYS[store]);
    return items.find(i => i.id === id) || null;
  },

  // 최신 N건 조회
  getRecent(store, n = 5) {
    return this.getAll(store).slice(0, n);
  },
};

// ── 스키마 마이그레이션 ──
const SCHEMA_VERSION = 1;

function migrate() {
  const current = parseInt(localStorage.getItem('mj_version') || '0');
  if (current >= SCHEMA_VERSION) return;

  // v0 → v1: mounjaro 기록에 drugName 기본값 추가
  if (current < 1) {
    try {
      const key = KEYS.mounjaro;
      const raw = localStorage.getItem(key);
      if (raw) {
        const records = JSON.parse(raw);
        records.forEach(r => { if (!r.drugName) r.drugName = 'mounjaro'; });
        localStorage.setItem(key, JSON.stringify(records));
      }
    } catch(e) { /* 무시 */ }
  }

  localStorage.setItem('mj_version', SCHEMA_VERSION.toString());
}

// migrate()는 app.js에서 Users.init() 이후 명시적으로 호출

// ── 테스트 환경 모듈 내보내기 (Node.js/Jest) ──
if (typeof module !== 'undefined') {
  module.exports = { Storage, escapeHTML, migrate, KEYS, SCHEMA_VERSION };
}
