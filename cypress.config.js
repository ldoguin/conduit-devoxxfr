const { defineConfig } = require('cypress')

const API_ROOT = process.env.API_ROOT || 'http://localhost:4000';

module.exports = defineConfig({
  env: {
    apiUrl: API_ROOT,
    user: {
      email: 'tester@test.com',
      password: 'password1234',
      username: 'testuser',
    },
    codeCoverage: {
      url: `${API_ROOT}/__coverage__`,
    },
  },
  viewportHeight: 1000,
  viewportWidth: 1000,
  video: true,
  projectId: 'bh5j1d',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    baseUrl: API_ROOT,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
