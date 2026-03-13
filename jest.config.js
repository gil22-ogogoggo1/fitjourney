/** @type {import('jest').Config} */
module.exports = {
  // jsdom 환경: localStorage 등 브라우저 API 제공
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'js/storage.js',
    'js/users.js',
    'js/settings.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};
