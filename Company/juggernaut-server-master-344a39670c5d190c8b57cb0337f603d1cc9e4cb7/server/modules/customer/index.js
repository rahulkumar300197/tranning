const Joi = require('joi');
const Boom = require('boom');

const internals = {};


internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  // TODO Contact Us

  server.route([{
    method: 'POST',
    path: '/customer/registerFromEmail', // needs to be more specific
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const remoteIP = request.info.remoteAddress;
      const data = await controllers.CustomerController.createCustomer(headers, payloadData, remoteIP);
      return reply(data);
    },
    config: {
      description: 'Register a new customer via Email',
      tags: ['api', 'customer'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
          // utcoffset: Joi.number().required().description('utc offset'),
        }).unknown(),
        payload: {
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).required(),
          lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).required(),
          userName: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).trim().min(2).required(),
          email: Joi.string().email().optional(),
          password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/).min(8).required().description('password must contain at least one capital letter, small letter, digit with minimum 8 character')
            .options({
              language: {
                string: {
                  regex: {
                    base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                  },
                },
              },
            }),
          mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          companyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2),
          countryCode: Joi.string().regex(/^[0-9,+]+$/).trim().min(3).required(),
          companyAddress: Joi.string().trim().min(2),
          appVersion: Joi.number(),
          latitude: Joi.number().optional().min(-90).max(90),
          longitude: Joi.number().optional().min(-180).max(180),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
          referralCode: Joi.string().optional().min(7).max(14),
          deviceType: Joi.string().required()
            .valid([configs.UserConfiguration.get('/deviceTypes', {
              type: 'web',
            }),
            configs.UserConfiguration.get('/deviceTypes', {
              type: 'android',
            }),
            configs.UserConfiguration.get('/deviceTypes', {
              type: 'ios',
            }),
            ]),
          deviceToken: Joi.string().optional(),
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
            // eslint-disable-next-line max-len
            return reply(Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'DEVICE_TOKEN_MISSING' })));
          }
          const data = await controllers.UserController.exsitingUserCheck(userData, lang);
          return reply(data);
        },
      }],
    },
  }]);

  // Route to update customer profile
  server.route({
    method: 'PUT',
    path: '/customer/updateProfile',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = {
        userID: request.auth.credentials.UserSession.user._id,
      };
      const headers = request.headers;
      const data = await controllers.CustomerController.updateCustomer(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Customer can Update his/her Profile',
      auth: {
        strategy: 'JwtAuth',
        // scope: 'customer',
      },
      tags: ['api', 'customer'],
      validate: {
        payload: {
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          companyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2),
          companyAddress: Joi.string().trim().min(2),
          image: Joi.string().optional().description('image url'),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
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
  });


  server.route({
    method: 'PUT',
    path: '/customer/driverSearch',
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.CustomerController.getDriver(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Search Driver Near Address',
      tags: ['api', 'customer'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          locationDetails: Joi.object().keys({
            latitude: Joi.number().required().min(-90).max(90),
            longitude: Joi.number().required().min(-180).max(180),
            addressLine1: Joi.string().required().trim(),
            addressLine2: Joi.string().optional().trim(),
            city: Joi.string().required().trim().uppercase(),
            state: Joi.string().required().trim().uppercase(),
            country: Joi.string().optional().trim().uppercase(),
            zipCode: Joi.string().required().trim(),
          }).required().description('It is an object having different keys'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
      auth: {
        strategy: 'JwtAuth',
        // scope: 'customer',
      },
    },
  });


  server.route([{
    method: 'POST',
    path: '/admin/addCustomer',
    async handler(request, reply) {
      const payloadData = request.payload;
      payloadData.isAdminVerified = true;
      payloadData.createdBy = request.auth.credentials.UserSession.user._id;
      const headers = request.headers;
      const remoteIP = request.info.remoteAddress;
      const data = await controllers.CustomerController.createCustomer(headers, payloadData, remoteIP);
      return reply(data);
    },
    config: {
      description: 'Register a new customer via Email',
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
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).required(),
          lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).required(),
          userName: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).trim().min(2).required(),
          email: Joi.string().email().optional(),
          password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/).min(8).required().description('password must contain at least one capital letter, small letter, digit with minimum 8 character')
            .options({
              language: {
                string: {
                  regex: {
                    base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                  },
                },
              },
            }),
          mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          companyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2),
          countryCode: Joi.string().regex(/^[0-9,+]+$/).trim().min(3).required(),
          companyAddress: Joi.string().trim().min(2),
          appVersion: Joi.number(),
          latitude: Joi.number().optional().min(-90).max(90),
          longitude: Joi.number().optional().min(-180).max(180),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
          deviceType: Joi.string().required()
            .valid([configs.UserConfiguration.get('/deviceTypes', {
              type: 'web',
            }),
            configs.UserConfiguration.get('/deviceTypes', {
              type: 'android',
            }),
            configs.UserConfiguration.get('/deviceTypes', {
              type: 'ios',
            }),
            ]),
          deviceToken: Joi.string().optional(),
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
            // eslint-disable-next-line max-len
            return reply(Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'DEVICE_TOKEN_MISSING' })));
          }
          const data = await controllers.UserController.exsitingUserCheck(userData, lang);
          return reply(data);
        },
      }],
    },
  }]);

  server.route({
    method: 'PUT',
    path: '/admin/updateCustomer',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = {
        userID: request.payload._id,
      };
      delete request.payload._id;
      const headers = request.headers;
      const data = await controllers.CustomerController.updateCustomer(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Customer can Update his/her Profile',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
        payload: {
          _id: Joi.string().required().description('Customer userID to be updated'),
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          lastName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(3).optional(),
          companyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2),
          companyAddress: Joi.string().trim().min(2),
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
  name: 'customers',
};
