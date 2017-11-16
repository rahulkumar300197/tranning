const Confidence = require('confidence');

const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const config = {

    referralPattern: {

    },

    referralScheme: {
      $filter: 'type',
      singleReferral: 'One Referral for whole App',
      roleBasedReferral: 'Role Specific referrals',
      regionBasedReferral: 'Region Specific referrals',
      roleAndRegionBasedReferral: 'Role and Region Specific referrals',
      $default: 'null',
    },

    conditionOperator: {
      $filter: 'type',
      lessThan: '$lt',
      greaterThan: '$gt',
      lessThanEqualTo: '$lte',
      greaterThanEqualTo: '$gte',
      equalTo: '$eq',
    },

    shortIDCharacters: {
      charSet: '0123456789$@abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
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
    configurationName: 'ReferralConfiguration',
    get,
    meta,
  };
};
