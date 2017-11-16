

const Joi = require('joi');
const Boom = require('boom');


const internals = {};


internals.applyRoutes = function (server, next) {
  const configs = server.plugins['core-config'];
  const controllers = server.plugins['core-controller'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route([{
    method: 'POST',
    path: '/serviceProvider/register',
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const remoteIP = request.info.remoteAddress;
      const data = await controllers.SPController.createServiceProvider(headers, payloadData, remoteIP);
      return reply(data);
    },
    config: {
      description: 'Register a new service Provider',
      tags: ['api', 'serviceProvider'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
          utcoffset: Joi.number().required().description('utc offset'),
        }).unknown(),
        payload: {
          registrationType: Joi.string().required().description('Individual or Company'),
          companyName: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).trim().min(3).optional(),
          email: Joi.string().email().optional(),
          countryCode: Joi.string().trim().min(2).required(),
          mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,}$/).min(8).required().description('must contain at least one capital letter, small letter, digit with minimum 8 characters')
            .options({
              language: {
                string: {
                  regex: {
                    base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                  },
                },
              },
            }),
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).required(),
          lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          userName: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).trim().min(3).required(),
          vehicleNumber: Joi.string().optional().description('vehicle number'),
          companyAddress: Joi.string().trim().min(3).required(),
          latitude: Joi.number().required().min(-90).max(90).description('range from -90 to 90'),
          longitude: Joi.number().required().min(-180).max(180).description('range from -180 to 180'),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
          referralCode: Joi.string().optional().min(7).max(14),
          deviceToken: Joi.string().optional().trim().description('android/ios device token'),
          deviceType: Joi.string().required()
            .valid([configs.UserConfiguration.get('/deviceTypes', { type: 'web' }),
              configs.UserConfiguration.get('/deviceTypes', { type: 'android' }),
              configs.UserConfiguration.get('/deviceTypes', { type: 'ios' })]),
          image: Joi.string().optional().description('image url'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
      pre: [{
        assign: 'userAlreadyExistCheck',
        async method(request, reply) {
          const userData = request.payload;
          const lang = request.headers['content-language'];
          if ((userData.deviceType !== configs.UserConfiguration.get('/deviceTypes', { type: 'web' })) && (!userData.deviceToken)) {
            //eslint-disable-next-line
            return reply(Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'DEVICE_TOKEN_MISSING' })));
          }
          const data = await controllers.UserController.exsitingUserCheck(userData, lang);
          return reply(data);
        },
      }],
    },
  },
  {
    method: 'PUT',
    path: '/serviceProvider/updateProfile',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = {
        userID: request.auth.credentials.UserSession.user._id,
      };
      const headers = request.headers;
      const data = await controllers.SPController.updateServiceProvider(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Service Provider Update profile',
      auth: {
        strategy: 'JwtAuth',
        // scope: 'serviceProvider',
      },
      tags: ['api', 'serviceProvider'],
      validate: {
        payload: {
          registrationType: Joi.string().description('Individual or Company'),
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).optional(),
          lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).optional(),
          companyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).optional(),
          companyAddress: Joi.string().trim().min(2).optional(),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
          image: Joi.string().optional().description('image url'),
        },
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/addServiceProvider',
    async handler(request, reply) {
      const payloadData = request.payload;
      payloadData.isAdminVerified = true;
      payloadData.createdBy = request.auth.credentials.UserSession.user._id;
      const headers = request.headers;
      const remoteIP = request.info.remoteAddress;
      const data = await controllers.SPController.createServiceProvider(headers, payloadData, remoteIP);
      return reply(data);
    },
    config: {
      description: 'Register a new service Provider',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required().description('Bearer Token'),
          utcoffset: Joi.number().required().description('utc offset'),
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          registrationType: Joi.string().required().description('Individual or Company'),
          companyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          email: Joi.string().email().optional(),
          countryCode: Joi.string().trim().min(2).required(),
          mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{4,}$/).min(8).required().description('must contain at least one capital letter, small letter, digit with minimum 8 characters')
            .options({
              language: {
                string: {
                  regex: {
                    base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                  },
                },
              },
            }),
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).required(),
          lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          userName: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).trim().min(3).required(),
          vehicleNumber: Joi.string().optional().description('vehicle number'),
          companyAddress: Joi.string().trim().min(2).required(),
          latitude: Joi.number().required().min(-90).max(90),
          longitude: Joi.number().required().min(-180).max(180),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
          deviceToken: Joi.string().optional().trim().description('android/ios device token'),
          deviceType: Joi.string().required()
            .valid([configs.UserConfiguration.get('/deviceTypes', { type: 'web' }),
              configs.UserConfiguration.get('/deviceTypes', { type: 'android' }),
              configs.UserConfiguration.get('/deviceTypes', { type: 'ios' })]),
          image: Joi.string().optional().description('image url'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      pre: [{
        assign: 'userAlreadyExistCheck',
        async method(request, reply) {
          const userData = request.payload;
          const lang = request.headers['content-language'];
          if ((userData.deviceType !== configs.UserConfiguration.get('/deviceTypes', { type: 'web' })) && (!userData.deviceToken)) {
            //eslint-disable-next-line
            return reply(Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'DEVICE_TOKEN_MISSING' })));
          }
          const data = await controllers.UserController.exsitingUserCheck(userData, lang);
          return reply(data);
        },
      }],
    },
  },
  {
    method: 'PUT',
    path: '/admin/updateServiceProvider',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = {
        userID: request.payload._id,
      };
      delete request.payload._id;
      const headers = request.headers;
      const data = await controllers.SPController.updateServiceProvider(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Service Provider Update profile',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
        payload: {
          _id: Joi.string().required().description('Customer userID to be updated'),
          registrationType: Joi.string().description('Individual or Company'),
          companyName: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).trim().min(3).optional(),
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          companyAddress: Joi.string().trim().min(2).optional(),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
          image: Joi.string().optional().description('image url'),
        },
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  },
  ]);

  server.route({
    method: 'GET',
    path: '/serviceProvider/getDashboardCount',
    async handler(request, reply) {
      const headers = request.headers;
      const userData = request.auth.credentials.UserSession.user;
      const data = await controllers.SPController.getDashboardCount(headers, userData);
      return reply(data);
    },
    config: {
      description: 'Get Dashboard Count',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'serviceProvider'],
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
  server.dependency(['auth',
    'users',
    'core-controller',
    'core-models',
    'core-config',
    'core-utility-functions',
    'core-services',
  ], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'serviceProviders',
};
