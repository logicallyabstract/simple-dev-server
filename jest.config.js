module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts', '!src/cli.ts', '!fixtures/**/*'],
};
