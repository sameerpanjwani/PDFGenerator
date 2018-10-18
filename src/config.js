/* eslint-disable no-process-env */
// Env vars should be casted to correct types
const config = {
  PORT: 9000,
  NODE_ENV: 'development',
  LOG_LEVEL: 'console',
  ALLOW_HTTP: 'true',
  DEBUG_MODE: 'true',
  API_TOKENS: [],
};

if (process.env.API_TOKENS) {
  config.API_TOKENS = process.env.API_TOKENS.split(',');
}

module.exports = config;
