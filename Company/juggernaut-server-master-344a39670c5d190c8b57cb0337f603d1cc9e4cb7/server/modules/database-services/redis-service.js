const redis = require('redis');

P.promisifyAll(redis.RedisClient.prototype);
P.promisifyAll(redis.Multi.prototype);

const client = redis.createClient();
const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const setData = function (key, value) {
    return client.set(key, value);
  };

  const getData = function (key) {
    return client.getAsync(key);
  };

  return {
    serviceName: 'RedisService',
    getData,
    setData,
  };
};
