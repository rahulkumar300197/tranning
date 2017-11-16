const Confidence = require('confidence');

const internals = {};

let PORT;
let DOMIAN_FRONT_END;
let DOMIAN_FRONT_END_FLEET;

if (process.env.NODE_ENV === 'test') {
  DOMIAN_FRONT_END_FLEET = 'http://localhost:3000';
  DOMIAN_FRONT_END = 'http://localhost:3000';
  PORT = 3001;
} else if (process.env.NODE_ENV === 'production') {
  DOMIAN_FRONT_END_FLEET = 'http://localhost:3000';
  DOMIAN_FRONT_END = 'http://localhost:3000';
  PORT = 3003;
} else if (process.env.NODE_ENV === 'development') {
  DOMIAN_FRONT_END_FLEET = 'http://localhost:3000';
  DOMIAN_FRONT_END = 'http://localhost:3000';
  PORT = 3002;
} else {
  PORT = 3001;
}

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const config = {

    projectName: 'Cl Base Project',

    roles: {
      $filter: 'role',
      customer: 'customer',
      driver: 'driver',
      admin: 'admin',
      serviceProvider: 'serviceProvider',
      $default: 'null',
    },

    address: {
      $filter: 'type',
      SELF: 'SELF',
      PICKUP: 'PICKUP',
      DELIVERY: 'DELIVERY',
    },

    SERVER: {
      APP_NAME: 'Trucker',
      PORTS: {
        HAPI: PORT,
      },
      TOKEN_EXPIRATION_IN_MINUTES: 600,
      JWT_SECRET_KEY: 'sUPerSeCuREKeY&^$^&$^%$^%7782348723t4872t34Ends',
      GOOGLE_API_KEY: 'googleApiKey',
      COUNTRY_CODE: '+91',
      MAX_DISTANCE_RADIUS_TO_SEARCH: '1',
      THUMB_WIDTH: 50,
      THUMB_HEIGHT: 50,
      BASE_DELIVERY_FEE: 25,
      COST_PER_KM: 9, // In USD
      DOMIAN_FRONT_END_URL: DOMIAN_FRONT_END,
      DOMIAN_FRONT_END_FLEET,
      APP_DOWNLOAD_LINK: 'https://play.google.com/store/apps/details?id=product.clicklabs.jugnoo',
      DOMAIN_NAME: 'http://localhost:8010/',
      SUPPORT_EMAIL: 'support@click-labs.com',
      STRIPE_SECRET_KEY: 'sk_test_sTzTABWICMFRdirnWSJ8YQhv',
    },

    BOOKING_STATUS: {
      $filter: 'STATUS',
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED',
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

    swaggerDefaultResponseMessages: [
      {
        code: 200,
        message: 'OK',
      },
      {
        code: 400,
        message: 'Bad Request',
      },
      {
        code: 401,
        message: 'Unauthorized',
      },
      {
        code: 404,
        message: 'Data Not Found',
      },
      {
        code: 500,
        message: 'Internal Server Error',
      },
    ],

    DATABASE: {
      $filter: 'DATABASE',
      LIMIT: 10,
      PROFILE_PIC_PREFIX: {
        ORIGINAL: 'profilePic_',
        THUMB: 'profileThumb_',
      },
      LOGO_PREFIX: {
        ORIGINAL: 'logo_',
        THUMB: 'logoThumb_',
      },
      CONSTANT_TYPE: {
        TAX: 'TAX',
        CANCEL_FEE: 'CANCEL_FEE',
        CONTRACT: 'CONTRACT',
        ADMIN_FEE: 'ADMIN_FEE',
      },
      DOCUMENT_PREFIX: 'document_',
      DRIVER: 'driver_',
      SHIPPER: 'shipper_',
      OTHER: 'doc_',
      USER_ROLES: {
        ADMIN: 'ADMIN',
        CUSTOMER: 'CUSTOMER',
        DRIVER: 'DRIVER',
        CARRIER: 'CARRIER',
      },
      FILE_TYPES: {
        LOGO: 'LOGO',
        DOCUMENT: 'DOCUMENT',
        OTHERS: 'OTHERS',
      },
      VEHICLE_TYPE: {
        BICYCLE: 'BICYCLE',
        SCOOTER: 'SCOOTER',
        CAR: 'CAR',
      },
      DEVICE_TYPES: {
        IOS: 'IOS',
        ANDROID: 'ANDROID',
        WEB: 'WEB',
      },
      LANGUAGE: {
        EN: 'EN',
        ES_MX: 'ES_MX',
      },
      PAYMENT_OPTIONS: {
        CREDIT_DEBIT_CARD: 'CREDIT_DEBIT_CARD',
        PAYPAL: 'PAYPAL',
        BITCOIN: 'BITCOIN',
        GOOGLE_WALLET: 'GOOGLE_WALLET',
        APPLE_PAY: 'APPLE_PAY',
        EIYA_CASH: 'EIYA_CASH',
        STRIPE: 'STRIPE',
      },
      SOCIAL: {
        FACEBOOK: 'FACEBOOK',
        LINKED_IN: 'LINKED_IN',
        GOOGLE_PLUS: 'GOOGLE_PLUS',
        TWITTER: 'TWITTER',
      },
      PROMO_DISCOUNT_TYPE: {
        PERCENT: 'PERCENT',
        AMOUNT: 'AMOUNT',
      },
      PROMO_TYPE: {
        FIRST_SHIPMENT: 'FIRST_SHIPMENT',
        REGULAR: 'REGULAR',
      },

    },

    NOTIFICATION: {
      $filter: 'NOTIFICATION',
      RECEIVED_BOOKING_REQUEST: 'RECEIVED_BOOKING_REQUEST',
      NEW_BOOKING_REQUEST: 'NEW_BOOKING_REQUEST',
      BOOKING_FORWARD_TO_DRIVER: 'BOOKING_FORWARD_TO_DRIVER',
      BOOKING_ACCEPTED: 'BOOKING_ACCEPTED',
      BOOKING_ACCEPTED_BY_DRIVER: 'BOOKING_ACCEPTED_BY_DRIVER',
      BOOKING_REJECTED: 'BOOKING_REJECTED',
      NEW_NOTIFICATION: 'NEW_NOTIFICATION',
      NEW_CUSTOMER_REGISTER: 'NEW_CUSTOMER_REGISTER',
      NEW_SERVICE_PROVIDER_REGISTER: 'NEW_SERVICE_PROVIDER_REGISTER',
      NEW_DRIVER_REGISTER: 'NEW_DRIVER_REGISTER',
      BOOKING_CANCELLED: 'BOOKING_CANCELLED',
      CANCELLED_BY_DRIVER: 'CANCELLED_BY_DRIVER',
      CANCELLED_BY_CUSTOMER: 'CANCELLED_BY_CUSTOMER',
      CANCELLED_BY_SERVICE_PROVIDER: 'CANCELLED_BY_SERVICE_PROVIDER',
      CANCELLED_BY_ADMIN: 'CANCELLED_BY_ADMIN',
      BOOKING_STATUS_CHANGE: 'BOOKING_STATUS_CHANGE',
      DRIVER_LOCATION_CHANGE: 'DRIVER_LOCATION_CHANGE',
      RATE_REVIEW: 'RATE_REVIEW',
      UNREAD_NOTIFICATION_COUNT: 'UNREAD_NOTIFICATION_COUNT',
      SET_AVAILABILITY: 'SET_AVAILABILITY',
      TRACK_DRIVER: 'TRACK_DRIVER',
      ASSIGN_DRIVER: 'ASSIGN_DRIVER',
    },
    SOCKET: {
      $filter: 'MESSAGE',
      ADDED_SOCKET_CONNECTION: 'Added To Socket Connections',
      INVALID_TOKEN: 'Invalid token',
      BAD_DATA: 'Bad data',
      INFO_EVENT: 'INFO',
      ERROR_EVENT: 'ERROR',
    },

    SEARCH_RADIUS: {
      $filter: 'USER',
      driver: 1,
      $default: 100,
    },

    JWT_SECRET_KEY: 'SyPMIaUEb1499022862927',
  };


  const store = new Confidence.Store(config);

  const get = function (key, criteria) {
    if (criteria) {
      return store.get(key, criteria);
    }

    return store.get(key);
  };


  const meta = function (key, criteria) {
    if (criteria) {
      return store.meta(key, criteria);
    }

    return store.meta(key, criteria);
  };
  return {
    configurationName: 'AppConfiguration',
    get,
    config,
    meta,
  };
};
