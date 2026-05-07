/* eslint-disable */
export default {
  displayName: 'integration-tests',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../test-results/coverage/integration',
  collectCoverage: true,
  collectCoverageFrom: [
    '../apps/api-gateway/src/**/*.ts',
    '../apps/booking-service/src/**/*.ts',
    '../apps/cinema-service/src/**/*.ts',
    '../apps/movie-service/src/**/*.ts',
    '../apps/user-service/src/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.d.ts',
    '!**/generated/**',
    '!**/prisma/**'
  ],
  reporters: [
    'default',
    '<rootDir>/reporters/BugReporter.js'
  ],
  testMatch: [
    '<rootDir>/integration/**/*.spec.ts',
    '<rootDir>/e2e/**/*.spec.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
};
