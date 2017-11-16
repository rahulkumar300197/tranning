const Confidence = require('confidence');
const Dotenv = require('dotenv');
let messages = require('./messages');

Dotenv.config({ silent: true });
const metaCriteria = {
  lang: 'eng',
};

const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  let store;

  const config = {
    lang: messages,
  };

  const cacheClear = function () {
    delete require.cache[require.resolve('./messages')];
    //eslint-disable-next-line
    messages = require('./messages');
    config.lang = messages;
    store = new Confidence.Store(config);
  };

  store = new Confidence.Store(config);

  const get = function (key, criteria) {
    return store.get(key, criteria);
  };


  const meta = function (key) {
    return store.meta(key, metaCriteria);
  };

  return {
    configurationName: 'MessageConfiguration',
    get,
    meta,
    cacheClear,
  };
};
