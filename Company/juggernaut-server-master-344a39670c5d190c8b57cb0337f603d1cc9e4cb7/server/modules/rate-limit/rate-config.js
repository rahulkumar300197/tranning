

const Confidence = require('confidence');
const Dotenv = require('dotenv');


Dotenv.config({ silent: true });

const criteria = {
  env: process.env.NODE_ENV,
};

let store;
const rateLimitValues = require('./rating-constants');


const config = {
  rateLimit: rateLimitValues,
};

const cacheClear = function () {
  delete require.cache[require.resolve('./rating-constants')];
  // rateLimitValues = require('./rating-constants');
  config.rateLimit = rateLimitValues;
  store = new Confidence.Store(config);
};

store = new Confidence.Store(config);

exports.get = function (key) {
  return store.get(key, criteria);
};


exports.meta = function (key) {
  return store.meta(key, criteria);
};

exports.cacheClear = cacheClear;

