

const Confidence = require('confidence');


const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const config = {

    SERVER: {
      MODE: 'sandbox', // sandbox or live
      CLIENTID: 'Af7jfXd8ZsxtbMRG-Y5DVrNqfD0XREmNc708fImM0WzirxxkrlCRT6S3oBgECoojB7Vi_vVUpOhNgKWU',
      CLIENTSECRET: 'EISEwmQ7cJNIpwveMEa-WO7Q1U776vvYfwF76nt0jF9wJPih_VXlZFYczuSi1F7apDL0HngLDQhFaS-k',
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
    configurationName: 'PaypalConfiguration',
    config,
    get,
    meta,
  };
};
