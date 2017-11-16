

const Confidence = require('confidence');


const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const config = {

    SERVER: {
      STRIPE_SECRET_KEY: 'sk_test_sTzTABWICMFRdirnWSJ8YQhv',
    },
  };


  const store = new Confidence.Store(config);

  const get = function (key, criteria) {
    if (criteria) {
      return store.get(key, criteria);
    }

    return store.get(key);
  };


  const meta = function (key, criteria) {
    if (criteria) { return store.meta(key, criteria); }

    return store.meta(key, criteria);
  };


  return {
    configurationName: 'StripeConfiguration',
    config,
    get,
    meta,
  };
};
