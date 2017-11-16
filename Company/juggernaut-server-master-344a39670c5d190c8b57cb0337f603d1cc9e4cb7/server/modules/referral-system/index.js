const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route({
    method: 'POST',
    path: '/referral/addReferralSchemeType',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userData = request.auth.credentials.UserSession.user;
      const data = await controllers.ReferralController.addReferralSchemeType(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'set referral scheme type',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'referral'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          referralSchemeType: Joi.string().required().description('type of referral scheme to be used')
            .valid([
              configs.ReferralConfiguration.get('/referralScheme', { type: 'singleReferral' }),
              configs.ReferralConfiguration.get('/referralScheme', { type: 'roleBasedReferral' }),
              configs.ReferralConfiguration.get('/referralScheme', { type: 'regionBasedReferral' }),
              configs.ReferralConfiguration.get('/referralScheme', { type: 'roleAndRegionBasedReferral' }),
            ]),
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
    method: 'POST',
    path: '/referral/addReferralScheme',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userData = request.auth.credentials.UserSession.user;
      const data = await controllers.ReferralController.addReferralScheme(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'set referral scheme',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'referral'],

      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          instant: Joi.boolean().required().description('false if wait for certain number of bookings before referral applied, else true'),

          isAfterBooking: Joi.boolean().default('false').description('true if to be applied after booking is completed, else true '),

          waitBookingNumber: Joi.number().default(0).optional().description('if instant if false, bookings wait, before referral applied'),
          noOfReferrals: Joi.number().required().description('total number of times referral of user can be used'),
          minimumBookingPrice: Joi.number().required().default(0).description('Minimum price of booking on which referral will be applied'),

          cashbackForOwner: Joi.number().optional().description('cashback for user who created referral'),
          cashbackForUser: Joi.number().optional().description('cashback for user who used referral'),

          percentageForOwner: Joi.number().optional().description('% off for user who created referral'),
          percentageForUser: Joi.number().optional().description('% off for user who used referral'),

          operatableBookingsForOwner: Joi.number().required().description('operatable upto bookings for user who created referral'),
          operatableBookingsForUser: Joi.number().required().description('operatable upto bookings for user who used referral'),

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
    path: '/referral/deleteScheme',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userData = {
        userID: request.auth.credentials.UserSession.user._id,
        role: request.auth.credentials.scope,
      };
      const data = await controllers.ReferralController.deleteScheme(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'delete referral scheme by admin',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'referral'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          referralPattern: Joi.string().required().description('Referral pattern to delete'),
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
    path: '/referral/listAllReferral',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.ReferralController.getAllScheme(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'delete referral scheme by admin',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'referral'],
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
    path: '/user/getReferralBenifitsHistory',
    async handler(request, reply) {
      const userData = request.auth.credentials.UserSession.user;
      const headers = request.headers;
      const data = await controllers.ReferralController.checkReferralBenifits(headers, userData);
      return reply(data);
    },
    config: {
      description: 'Get referral benifits history',
      tags: ['api', 'user'],
      auth: {
        strategy: 'JwtAuth',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
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
  name: 'referral',
};
