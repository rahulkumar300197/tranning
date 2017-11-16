const Confidence = require('confidence');

const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const config = {

    promoScheme: {
      $filter: 'type',
      promoForAllUsers: 'Promo for all users',
      roleSpecificPromo: 'Role Specific Promo',
      regionSpecificPromo: 'Region Specific Promo',
      roleAndRegionSpecificPromo: 'Role and Region Specific promo',
      $default: 'null',
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
    configurationName: 'PromoConfiguration',
    get,
    meta,
  };
};
