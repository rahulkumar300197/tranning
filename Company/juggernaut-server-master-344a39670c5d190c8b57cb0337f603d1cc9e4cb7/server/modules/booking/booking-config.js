

const Confidence = require('confidence');


const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const config = {

    BOOKING_STATUS: {
      $filter: 'STATUS',
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED',
      REJECTED: 'REJECTED',
      ENROUTE_TO_PICKUP: 'ENROUTE_TO_PICKUP',
      PICKED_UP: 'PICKED_UP',
      ENROUTE_TO_DELIVERY: 'ENROUTE_TO_DELIVERY',
      DELIVERED: 'DELIVERED',
      COMPLETED: 'COMPLETED',
      CANCELLED_BY_DRIVER: 'CANCELLED_BY_DRIVER',
      CANCELLED_BY_CUSTOMER: 'CANCELLED_BY_CUSTOMER',
      CANCELLED_BY_SERVICE_PROVIDER: 'CANCELLED_BY_SERVICE_PROVIDER',
      CANCELLED_BY_ADMIN: 'CANCELLED_BY_ADMIN',
      EXPIRED: 'EXPIRED',
      TIME_PASSED: 'Booking time is already passed',
    },

    ASSIGNMENT_ALGO: {
      $filter: 'type',
      MANUAL: 'Manual',
      BROADCAST: 'Broadcast',
      ROUND_ROBIN: 'Round Robin',
    },

    BOOKING_TYPE: {
      $filter: 'type',
      FRESH_BOOKING: 'FRESH_BOOKING_REQUEST',
      FRESH_UNACCEPTED_BOOKING: 'FRESH_UNACCEPTED_BOOKING_REQUEST',
      CANCELLED_BOOKING: 'CANCELLED_BOOKING_REQUEST',
    },

    BID_STATUS: {
      PLACED: 'PLACED',
      ACCEPTED: 'ACCEPTED',
      SPLIT_BY_CUSTOMER: 'SPLIT_BY_CUSTOMER',
      COUNTER_BY_CUSTOMER: 'COUNTER_BY_CUSTOMER',
      SPLIT_BY_DRIVER: 'SPLIT_BY_DRIVER',
      COUNTER_BY_DRIVER: 'COUNTER_BY_DRIVER',
      SPLIT_BY_FLEET_OWNER: 'SPLIT_BY_FLEET_OWNER',
      COUNTER_BY_FLEET_OWNER: 'COUNTER_BY_FLEET_OWNER',
      CANCELLED_BY_DRIVER: 'CANCELLED_BY_DRIVER',
      CANCELLED_BY_FLEET_OWNER: 'CANCELLED_BY_FLEET_OWNER',
      CANCELLED_BY_CUSTOMER: 'CANCELLED_BY_CUSTOMER',
      EXPIRED: 'EXPIRED',
      AUTO_REJECTED: 'AUTO_REJECTED',
      ON_THE_WAY: 'ON_THE_WAY',
      SPLIT_DONE_BY_FLEET_OWNER: 'SPLIT_DONE_BY_FLEET_OWNER',
      SPLIT_DONE_BY_DRIVER: 'SPLIT_DONE_BY_DRIVER',
      COUNTER_DONE_BY_DRIVER: 'COUNTER_DONE_BY_DRIVER',
      COUNTER_DONE_BY_FLEET_OWNER: 'COUNTER_DONE_BY_FLEET_OWNER',
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
    configurationName: 'BookingConfiguration',
    get,
    config,
    meta,
  };
};
