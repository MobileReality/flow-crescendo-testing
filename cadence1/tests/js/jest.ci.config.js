const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testRegex: '.(test|bundle).js$',
};
