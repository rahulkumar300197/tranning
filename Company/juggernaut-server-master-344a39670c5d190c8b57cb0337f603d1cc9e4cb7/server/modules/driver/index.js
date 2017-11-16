const Joi = require('joi');
const Boom = require('boom');

const internals = {};
internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route([{
    method: 'POST',
    path: '/driver/registerFromEmail',
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const remoteIP = request.info.remoteAddress;
      const data = await controllers.DriverController.createDriver(headers, payloadData, remoteIP);
      return reply(data);
    },
    config: {
      description: 'Register new Driver via Email',
      tags: ['api', 'driver'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
          utcoffset: Joi.number().required().description('utc offset'),
        }).unknown(),
        payload: {
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
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
          companyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).optional(),
          countryCode: Joi.string().trim().min(2).required(),
          companyAddress: Joi.string().trim().min(2),
          deviceToken: Joi.string().optional().trim().description('android/ios device token'),
          appVersion: Joi.string().optional().trim(),
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required(),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
          referralCode: Joi.string().optional().min(7).max(14),
          licenceNumber: Joi.string().min(4).trim(),
          MCNumber: Joi.string().trim().required(),
          vehicleType: Joi.array().items(Joi.string().required()).description('Vehicle Type'),
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
            // eslint-disable-next-line max-len
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
    path: '/driver/updateProfile',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = {
        userID: request.auth.credentials.UserSession.user._id,
        email: request.auth.credentials.UserSession.user.email,
        driverAddressID: request.auth.credentials.UserSession.user.driverAddressID,
        driverID: request.auth.credentials.UserSession.user.driverID,
      };
      const headers = request.headers;
      const data = await controllers.DriverController.updateDriver(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Driver Update profile',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'driver'],
      validate: {
        payload: {
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2),
          lastName: Joi.string().optional(),
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
  },
  {
    method: 'POST',
    path: '/driver/addVehicle',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = {
        userID: request.auth.credentials.tokenData.userID,
      };
      const headers = request.headers;
      const data = await controllers.DriverController.addVehicle(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Driver Update vehicle',
      auth: {
        strategy: 'preVerificationAuth',
      },
      tags: ['api', 'driver'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          vehicleType: Joi.string().required(),
          vehicleCompany: Joi.string().required(),
          vehicleYear: Joi.number().min(1000).max(9999).required(),
          licenceNumber: Joi.string().required().description('Image url of licence'),
          vehicleNumber: Joi.string().required(),
          vehicleImages: Joi.array().items(Joi.object().keys({
            original: Joi.string().required().trim(),
            thumbnail: Joi.string().required().trim(),
          }).optional()).optional().description("insert array of images for vehicle [{ 'original': 'string', 'thumbnail': 'string' }]"),
          isPrimary: Joi.boolean(),
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
  },
  {
    method: 'GET',
    path: '/driver/getVehicleDetails',
    async handler(request, reply) {
      const userData = {
        userID: request.auth.credentials.UserSession.user._id,
      };
      const queryData = request.query;
      const headers = request.headers;
      const data = await controllers.DriverController.getVehicle(headers, userData, queryData);
      return reply(data);
    },
    config: {
      description: 'get vehicle details',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'driver'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
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
  },
  {
    method: 'DELETE',
    path: '/driver/deleteVehicle',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userData = {
        userID: request.auth.credentials.UserSession.user._id,
      };
      const data = await controllers.DriverController.deleteVehicle(headers, userData, payloadData);
      return reply(data);
    },
    config: {
      description: 'soft delete vehicle data',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'driver'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          vehicleNumber: Joi.string().required().description('vehicle Number which is to be deleted'),
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
  },
  {
    method: 'POST',
    path: '/admin/vehicleTypeAndCompany',
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.DriverController.addVehicleTypeAndCompany(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'add vehicle type and company',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          vehicleType: Joi.string().required().description('add type of vehicle'),
          vehicleCompany: Joi.string().required().description('add type of vehicle company'),
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
  },
  {
    method: 'GET',
    path: '/driver/listVehicleTypeAndCompany',
    async handler(request, reply) {
      const queryData = request.query;
      const headers = request.headers;
      const data = await controllers.DriverController.listVehicleTypeAndCompany(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'get vehicle type and company',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'driver'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
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
  },
  {
    method: 'DELETE',
    path: '/admin/deleteVehicleTypeAndCompany',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.DriverController.deleteVehicleTypeAndCompany(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'soft delete vehicle type and company',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          vehicleType: Joi.string().required().description('type of vehicle'),
          vehicleCompany: Joi.string().required().description('type of vehicle company'),
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
  },
  {
    method: 'POST',
    path: '/admin/addDriver', // needs to be more specific
    async handler(request, reply) {
      const payloadData = request.payload;
      payloadData.isAdminVerified = true;
      payloadData.createdBy = request.auth.credentials.UserSession.user._id;
      const headers = request.headers;
      const remoteIP = request.info.remoteAddress;
      const data = await controllers.DriverController.createDriver(headers, payloadData, remoteIP);
      return reply(data);
    },
    config: {
      description: 'Register new Driver via Email',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      state: {
        parse: false, // parse and store in request.state
        failAction: 'ignore', // may also be 'ignore' or 'log'
      },
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
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
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
          companyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).optional(),
          countryCode: Joi.string().trim().min(2).required(),
          companyAddress: Joi.string().trim().min(2),
          deviceToken: Joi.string().optional().trim().description('android/ios device token'),
          appVersion: Joi.string().optional().trim(),
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required(),
          city: Joi.string().optional().description('user address city'),
          state: Joi.string().optional().description('user address state'),
          zipCode: Joi.string().optional().description('zipcode of user address'),
          licenceNumber: Joi.string().min(4).trim(),
          MCNumber: Joi.string().trim().required(),
          vehicleType: Joi.array().items(Joi.string().required()).description('Vehicle Type'),
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
            // eslint-disable-next-line max-len
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
    path: '/admin/updateDriver',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = {
        userID: request.payload._id,
      };
      delete request.payload._id;
      const headers = request.headers;
      const data = await controllers.DriverController.updateDriver(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Driver Update profile',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
        payload: {
          _id: Joi.string().required().description('Customer userID to be updated'),
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2),
          lastName: Joi.string().optional(),
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
  },
  {
    method: 'PUT',
    path: '/serviceProvider/updateDriver',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = {
        userID: request.payload._id,
      };
      delete request.payload._id;
      const headers = request.headers;
      const data = await controllers.DriverController.updateDriver(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Driver Update profile',
      auth: {
        strategy: 'JwtAuth',
        // scope: 'admin',
      },
      tags: ['api', 'serviceProvider'],
      validate: {
        payload: {
          _id: Joi.string().required().description('Customer userID to be updated'),
          name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2),
          lastName: Joi.string().optional(),
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
      pre: [{
        assign: 'validateServiceProvider',
        async method(request, reply) {
          const userData = {
            userID: request.payload._id,
          };
          const serviceProvider = request.auth.credentials.UserSession.user;
          const headers = request.headers;
          const data = await controllers.DriverController.validateServiceProvider(headers, serviceProvider, userData);
          return reply(data);
        },
      }],
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  },
  ]);


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
  name: 'drivers',
};
