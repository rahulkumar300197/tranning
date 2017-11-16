

const Confidence = require('confidence');


const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const config = {

    roles: {
      $filter: 'role',
      customer: 'customer',
      driver: 'driver',
      admin: 'admin',
      serviceProvider: 'serviceProvider',
      all: 'all',
      $default: null,
    },

    social: {
      $filter: 'type',
      facebook: 'Facebook',
      google: 'Google',
      linkedIn: 'LinkedIn',
      twitter: 'Twitter',
    },

    verifySocialUser: {
      $filter: 'platform',
      facebook: 'https://graph.facebook.com/v2.10/me?access_token=',
      google: 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=',
    },

    deviceTypes: {
      $filter: 'type',
      ios: 'IOS',
      android: 'ANDROID',
      web: 'WEB',
    },

    shipmentCurrentStatus: {
      $filter: 'shipmentStatus',

      picking: 'AboutToPickup',
      picked: 'PickedUp',
      delivering: 'ReachedToDeliver',
      delivered: 'DELIVERED',
    },

    creditTypes: {
      $filter: 'type',
      amount: 'amount',
      percentage: 'percentage',
      $default: 'amount',
    },
    emailVerifyUrl: {
      $filter: 'env',
      dev: 'https://dev-juggernaut.clicklabs.in/user/verifyEmail',
      test: 'https://test-juggernaut.clicklabs.in/user/verifyEmail',
      production: 'https://juggernaut.clicklabs.in/user/verifyEmail',
      $default: 'http://localhost:3001/user/verifyEmail',
    },
    adminUrl: {
      $filter: 'env',
      dev: 'https://dev-juggernaut.clicklabs.in/#/setPassword',
      test: 'https://test-juggernaut.clicklabs.in/#/setPassword',
      production: 'https://juggernaut.clicklabs.in/#/setPassword',
      $default: 'http://localhost:3001/#/setPassword',
    },
    resetPasswordUrl: {
      $filter: 'env',
      dev: 'https://dev-juggernaut.clicklabs.in/#/resetPassword',
      test: 'https://test-juggernaut.clicklabs.in/#/resetPassword',
      production: 'https://juggernaut.clicklabs.in/#/resetPassword',
      $default: 'http://localhost:3001/#/resetPassword',
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
    configurationName: 'UserConfiguration',
    get,
    meta,
    config,
  };
};
