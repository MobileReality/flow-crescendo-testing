module.exports = {
  testTimeout: 320000,
  testEnvironment: './src/environment.js',
  verbose: true,
  setupFilesAfterEnv: ['./src/setup.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testRegex: '.migration.js$',
  resolver: '<rootDir>/jest.resolver.js',
  transformIgnorePatterns: ['node_modules/(?!(testing-(legacy|stable))/)'],
};
