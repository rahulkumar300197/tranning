const Config = require('./config');
const catboxMemory = require('catbox-memory');
const RateConfig = require('./modules/rate-limit/rate-config');
const Path = require('path');
const fs = require('fs');


let http;
const criteria = {
  env: process.env.NODE_ENV,
};
let options;
let tls = false
if(process.env.HTTP2 === 'true'){
  options = {
    key: fs.readFileSync(Config.get('/http2Certs/key', criteria)),
    cert: fs.readFileSync(Config.get('/http2Certs/cert', criteria)),
  };
  tls = true
  http = require('http2')
}else{
  http = require('http')
}

let protocol = tls ? ['https'] : ['http']

const manifest = {

  server: {
    cache: {
      engine: catboxMemory,
    },
    connections: {
      routes: {
        security: false,
        cors: {
          origin: ['*'],
          additionalHeaders: ['cache-control', 'x-requested-with',
            'content-language', 'postman-token', 'authorization',
            'utcoffset'],
          credentials: true,
        },
      },
    },
  },
  connections: [{
    listener: http.createServer(options),
    port: Config.get('/port/web', criteria),
    labels: ['web'],
    tls: tls
  }],
  registrations: [
    {
      plugin: {
        register: 'hapi-swagger',
        options: {
          info: Config.get('/swaggerInfo', criteria),
          documentationPage: Config.get('/swaggerDocumentationPage', criteria),
          grouping: 'tags',
          schemes: protocol
        },
      },
    },
    {
      plugin: {
        register: 'hapi-rate-limit',
        options: RateConfig.get('/rateLimit'),
      },
    },
    {
      plugin: 'hapi-auth-bearer-token',
    },
    {
      plugin: {
        register: 'inert',
        path: {
          relativeTo: Path.join(__dirname, 'modules/client/dist'),
        },
      },
    },
    {
      plugin: 'vision',
    },
    {
      plugin: './server/modules/bootstrap',
    },
    {
      plugin: {
        register: './server/core/core-configs', // Restricted to core only ...
        options: {
          globPattern: './**/**/*-config.js', // Required
          globOptions: { // https://github.com/isaacs/node-glob
            cwd: __dirname, // Required
            nosort: true, // Optional, utils for mongoose descriptors
          },
        },
      },
    },
    {
      plugin: {
        register: './server/core/core-utility-functions',
        options: {
          globPattern: './lib/*-function.js', // Required
          globOptions: { // https://github.com/isaacs/node-glob
            cwd: __dirname, // Required
            nosort: true, // Optional, utils for mongoose descriptors
          },
        },
      },
    },
    {
      plugin: {
        register: './server/core/core-models',
        options: {
          globPattern: './modules/**/*-model.js', // Required
          globOptions: { // https://github.com/isaacs/node-glob
            cwd: __dirname, // Required
            nosort: true, // Optional, utils for mongoose descriptors
          },
        },
      },
    },
    {
      plugin: {
        register: './server/core/core-services',
        options: {
          globPattern: './modules/**/*-service.js', // Required
          globOptions: { // https://github.com/isaacs/node-glob
            cwd: __dirname, // Required
            nosort: true, // Optional, utils for mongoose descriptors
          },
        },
      },
    },
    {
      plugin: {
        register: './server/core/core-controllers',
        options: {
          globPattern: './modules/**/*-controller.js', // Required
          globOptions: { // https://github.com/isaacs/node-glob
            cwd: __dirname, // Required
            nosort: true, // Optional, utils for mongoose descriptors
          },
        },
      },
    },
    {
      plugin: './server/modules/auth',
    },
    {
      plugin: './server/modules/role-manager/app-roles-script',
    },
    {
      plugin: './server/modules/verify-script',
    },
    {
      plugin: './server/modules/schedule/schedule-script',
    },
    {
      plugin: './server/modules/admin/admin-initialize-script',
    },
    {
      plugin: './server/modules/twilio/twilio-customer-support-script',
    },
    {
      plugin: './server/modules/multilingual/index',
    },
    {
      plugin: './server/modules/admin/index',
    },
    {
      plugin: './server/modules/user/index',
    },
    {
      plugin: './server/modules/driver/index',
    },
    {
      plugin: './server/modules/customer/index',
    },
    {
      plugin: './server/modules/service-provider/index',
    },
    {
      plugin: './server/modules/video-upload-stream/index',
    },
    {
      plugin: './server/modules/stripe-connect/index',
    },
    {
      plugin: './server/modules/socket-notification/index',
    },
    {
      plugin: './server/modules/stripe-payments/index',
    },
    {
      plugin: './server/modules/app-version/index',
    },
    {
      plugin: './server/modules/twilio/index',
    },
    {
      plugin: './server/modules/comment-system/index',
    },
    {
      plugin: './server/modules/likes-system/index',
    },
    {
      plugin: './server/modules/booking/index',
    },
    {
      plugin: './server/modules/booking-assignment/index',
    },
    {
      plugin: './server/modules/logger/scriptS3.js',
    },
    {
      plugin: './server/modules/tracking/index',
    },
    {
      plugin: './server/modules/paypal/index',
    },
    {
      plugin: './server/modules/services/index',
    },
    {
      plugin: './server/modules/schedule/index',
    },
    {
      plugin: './server/modules/rate-limit/index',
    },
    {
      plugin: './server/modules/matching/index',
    },
    {
      plugin: './server/modules/rating-review/index',
    },
    {
      plugin: './server/modules/tracking/tracking-script',
    },
    {
      plugin: './server/modules/authorization-engine/index',
    },
    {
      plugin: './server/modules/role-manager/index',
    },
    {
      plugin: './server/modules/referral-system/index',
    },
    {
      plugin: './server/modules/promo-system/index',
    },
    {
      plugin: './server/modules/social-user/index',
    },
  ],
};

exports.manifest = manifest;
