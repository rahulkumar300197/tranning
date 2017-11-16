const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route({
    method: 'POST',
    path: '/promo/addPromo',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userData = request.auth.credentials.UserSession.user;
      const data = await controllers.PromoController.addPromoScheme(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'set referral scheme',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'promo'],

      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          promoSchemeType: Joi.string().required().description('type of promo scheme to be used')
            .valid([
              configs.PromoConfiguration.get('/promoScheme', { type: 'promoForAllUsers' }),
              configs.PromoConfiguration.get('/promoScheme', { type: 'roleSpecificPromo' }),
              configs.PromoConfiguration.get('/promoScheme', { type: 'regionSpecificPromo' }),
              configs.PromoConfiguration.get('/promoScheme', { type: 'roleAndRegionSpecificPromo' }),
            ]),

          noOfPromoUsers: Joi.number().optional().description('total number of times promo can be used, infinite in case of empty'),
          alias: Joi.string().required().description('Promo that should be displayed to user'),
          individualUserPromoAttempt: Joi.number().optional()
            .description('total number of times promo can be used by single user, infinite in case of empty'),
          minimumBookingPrice: Joi.number().required().default(0).description('Minimum price of booking on which promo will be applied'),

          cashback: Joi.number().optional().description('cashback for user who used promo'),

          percentage: Joi.number().optional().description('% off for user who used promo'),
          maxCashback: Joi.number().optional().description('maximum cashback for user to avoid the high percentage returns'),

          // expirePromoDate: Joi.date().optional().description('Expiry Date of the promo'),

          role: Joi.string().valid([configs.UserConfiguration.get('/roles', { role: 'customer' }),
            configs.UserConfiguration.get('/roles', { role: 'driver' }),
            configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
          ]).description('role of user order is  customer/driver/serviceProvider/admin'),

          coordinates: Joi.array().items(Joi.array().items(Joi.number().required()).required()).min(4)
            .description('[[0,0],[1,1],[2,2],[0,0]]'),

          regionName: Joi.string().description('name for coordinates'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'DELETE',
    path: '/promo/deletePromo',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userData = {
        userID: request.auth.credentials.UserSession.user._id,
        role: request.auth.credentials.scope,
      };
      const data = await controllers.PromoController.deletePromo(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'delete referral scheme by admin',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'promo'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          promoPattern: Joi.string().required().description('Referral pattern to delete'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/promo/listAllPromo',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.PromoController.getAllPromo(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'delete referral scheme by admin',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'promo'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          createdByUser: Joi.string().min(24).max(24).description('userID of the user to fetch referral created by that user only'),
          isDeleted: Joi.boolean(),
          limit: Joi.number().integer().optional().description('limit data in response'),
          skip: Joi.number().integer().optional().description('limit data from response'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/promo/getAllUserPromo',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const userData = {
        userID: request.auth.credentials.UserSession.user._id,
        role: request.auth.credentials.scope,
      };
      const data = await controllers.PromoController.getAllUserPromo(headers, queryData, userData);
      return reply(data);
    },
    config: {
      description: 'delete referral scheme by admin',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'promo'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          coordinates: Joi.array().items(Joi.number().required()).required()
            .description('[long,lat]'),
          limit: Joi.number().integer().optional().description('limit data in response'),
          skip: Joi.number().integer().optional().description('limit data from response'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/promo/promoDetails',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.PromoController.specificPromoDetails(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'delete referral scheme by admin',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'promo'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          alias: Joi.string().required(),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });


  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'promo',
};
