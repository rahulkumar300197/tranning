const Confidence = require('confidence');
const Dotenv = require('dotenv');

Dotenv.config({ silent: true });

const criteria = {
  env: process.env.NODE_ENV,
};

const config = {
  $meta: 'This file configures the plot device.',
  projectName: 'Cl-Base',
  port: {
    web: {
      $filter: 'env',
      test: 3000,
      production: process.env.PORT || 3003,
      dev: 3001,
      $default: 3001,
    },
  },

  swaggerInfo: {
    $filter: 'env',
    production: {
      title: 'Juggernaut-Server Production Documentation',
      version: 'V2.2.0',
      contact: {
        name: 'RAR',
        email: 'mukesh.sharma@mail.click-labs.com',
      },
    },
    test: {
      title: 'Juggernaut-Server Test Documentation',
      version: 'V2.3.0',
      contact: {
        name: 'RAR',
        email: 'mukesh.sharma@mail.click-labs.com',
      },
    },
    dev: {
      title: 'Juggernaut-Server Dev Documentation',
      version: 'V2.3.0',
      contact: {
        name: 'Mukesh Sharma',
        email: 'mukesh.sharma@mail.click-labs.com',
      },
    },
    $default: {
      title: 'CL Base Documenatation',
      version: 'V2.3.0',
      contact: {
        name: 'Mukesh Sharma',
        email: 'mukesh.sharma@mail.click-labs.com',
      },
    },
  },

  http2Certs: {
    key: {
      $filter: 'env',
      production: '/etc/ssl/baseproject.clicklabs.in.key',
      test: '/etc/ssl/baseproject.clicklabs.in.key',
      dev: '/etc/ssl/baseproject.clicklabs.in.key',
      $default: `${__dirname}/../Certs/key.pem`,
    },
    cert: {
      $filter: 'env',
      production: '/etc/ssl/baseproject.clicklabs.in.crt',
      test: '/etc/ssl/baseproject.clicklabs.in.crt',
      dev: '/etc/ssl/baseproject.clicklabs.in.crt',
      $default: `${__dirname}/../Certs/cert.pem`,
    }
  },
  swaggerDocumentationPage: {
    $filter: 'env',
    production: false,
    $default: true,
  },
  swaggerScheme: {
    $filter: 'env',
    production: 'https',
    test: 'https',
    dev: 'https',
    $default: 'http',
  },
  sentry: {
    $filter: 'env',
    production: 'https://1ec764ad5fb44f2b99e42cf140a2bceb:acc24e7849974c1eaf27a13502e12616@sentry.io/153941',
    test: 'https://1ec764ad5fb44f2b99e42cf140a2bceb:acc24e7849974c1eaf27a13502e12616@sentry.io/153941',
    dev: 'https://1ec764ad5fb44f2b99e42cf140a2bceb:acc24e7849974c1eaf27a13502e12616@sentry.io/153941',
    $default: 'https://1ec764ad5fb44f2b99e42cf140a2bceb:acc24e7849974c1eaf27a13502e12616@sentry.io/153941',
  },
  authAttempts: {
    forIp: 50,
    forIpAndUser: 7,
  },
  cookieSecret: {
    $filter: 'env',
    production: process.env.COOKIE_SECRET,
    $default: '!k3yb04rdK4tz~4qu4~k3yb04rdd0gz!',
  },

  hapiMongoModels: {
    mongodb: {
      uri: {
        $filter: 'env',
        production: `mongodb://${process.env.MONGO_USER || ''}:${process.env.MONGO_PASS || ''}@${process.env.MONGO_HOST || '127.0.0.1'}:27017/${process.env.MONGO_DBNAME_LIVE || 'juggernaut-live'}`,
        test: `mongodb://${process.env.MONGO_USER || ''}:${process.env.MONGO_PASS || ''}@${process.env.MONGO_HOST || '127.0.0.1'}:27017/${process.env.MONGO_DBNAME_TEST || 'juggernaut-test'}`,
        dev: `mongodb://${process.env.MONGO_USER || ''}:${process.env.MONGO_PASS || ''}@${process.env.MONGO_HOST || '127.0.0.1'}:27017/${process.env.MONGO_DBNAME_DEV || 'juggernaut-dev'}`,
        $default: 'mongodb://127.0.0.1:27017/juggernaut-server',
      },
    },
    autoIndex: true,
  },
};

const store = new Confidence.Store(config);

exports.get = function (key) {
  return store.get(key, criteria);
};


exports.meta = function (key) {
  return store.meta(key, criteria);
};

