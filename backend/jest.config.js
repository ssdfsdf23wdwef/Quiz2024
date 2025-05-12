module.exports = {
  preset: '@nestjs/testing',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.spec.ts$',
  collectCoverage: true,
  coverageDirectory: '../coverage',
  testPathIgnorePatterns: ['<rootDir>/dist/'],
};
