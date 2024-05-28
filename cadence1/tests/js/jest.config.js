module.exports = {
  testTimeout: 120000,
  testEnvironment: './src/environment.js',
  verbose: true,
  setupFilesAfterEnv: ['./src/setup.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  testRegex: '.(test|bundle|part).js$',
};
