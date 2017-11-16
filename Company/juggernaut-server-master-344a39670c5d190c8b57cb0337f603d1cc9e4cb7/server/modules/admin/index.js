const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route({
    method: 'PUT',
    path: '/admin/blockOption',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.AdminController.blockFunctionality(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          userID: Joi.string().required().description('user id').min(24).max(24),
          isBlocked: Joi.boolean().required(),
        },
      },
      auth: {
        strategy: 'JwtAuth',
      },
      description: 'Block Users',
      tags: ['api', 'admin'],
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
    path: '/admin/assignDriverToServiceProvider',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      payloadData.assignedBy = request.auth.credentials.UserSession.user._id;
      const data = await controllers.AdminController.assignDriverToServiceProvider(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          serviceProviderID: Joi.string().required().description('user id').min(24).max(24),
          driverID: Joi.string().required().description('user id').min(24).max(24),
        },
      },
      auth: {
        strategy: 'JwtAuth',
      },
      description: 'Block Users',
      tags: ['api', 'admin'],
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
    path: '/admin/verifyUser',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.AdminController.verifyUser(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          _id: Joi.string().required().description('user id').min(24).max(24),
        },
      },
      auth: {
        strategy: 'JwtAuth',
      },
      description: 'Verify Users',
      tags: ['api', 'admin'],
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },

  });

  server.route([{
    method: 'DELETE',
    path: '/admin/deleteUser', // needs to be more specific
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.AdminController.deleteUser(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Soft Delete a user',
      tags: ['api', 'admin'],
      auth: {
        strategy: 'JwtAuth',
      },
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
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          userID: Joi.string().required().min(24).max(24),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
  }]);

  server.route({
    method: 'GET',
    path: '/admin/userDetails',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.AdminController.getUserData(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'Get List Of All Customers by Role[serviceProvider, customer, driver]',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          userID: Joi.string().required().min(24).max(24),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'POST',
    path: '/admin/setDefaultSettings',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.AdminController.setDefaultSettings(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'set admin default settings',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          otpExpiresIn: Joi.number().min(60).description('should be in seconds minimum 60 seconds'),
          linkExpiresIn: Joi.number().min(60).description('should be in seconds minimum 60 seconds'),
          deleteTrackingData: Joi.number().min(1).max(24).description('should be in days'),
          contactUsEmail: Joi.string().email().description('contact us email for app'),
          webMultiSession: Joi.boolean().required().description('multi session for web panel'),
          deviceMultiSession: Joi.boolean().required().description('multi session for device panel'),
          adminTokenExpireTime: Joi.number().min(1).description('admin token expire time'),
          userTokenExpireTime: Joi.number().min(1).description('user token expire time'),
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
    path: '/admin/listDefaultSettings',
    async handler(request, reply) {
      const headers = request.headers;
      const data = await controllers.AdminController.listDefaultSettings(headers);
      return reply(data);
    },
    config: {
      description: 'set admin default settings',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
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
    method: 'GET',
    path: '/admin/getAllUsers',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const userData = request.auth.credentials.UserSession.user;
      const role = request.auth.credentials.scope;
      if (role !== configs.UserConfiguration.get('/roles', { role: 'admin' })) {
        queryData.createdBySelf = true;
      }
      const data = await controllers.AdminController.getAllUsers(headers, queryData, userData);
      return reply(data);
    },
    config: {
      description: 'Get List Of All Customers by Role[serviceProvider, customer, driver]',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'admin'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          role: Joi.string().required().valid(['all', configs.UserConfiguration.get('/roles', { role: 'customer' }),
            configs.UserConfiguration.get('/roles', { role: 'driver' }),
            configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
            configs.UserConfiguration.get('/roles', { role: 'admin' }),
          ]).description('role of user order is  customer/driver/serviceProvider/admin'),
          isBlocked: Joi.any().allow(['all', true, false]).required(),
          isDeleted: Joi.any().allow(['all', true, false]).required(),
          isAdminVerified: Joi.any().allow(['all', true, false]).required(),
          createdBySelf: Joi.boolean().optional().description('list only users created by self if true else all'),
          searchUser: Joi.string().optional().description('user email or name'),
          limit: Joi.number().integer().optional().description('limit data in response'),
          skip: Joi.number().integer().optional().description('limit data from response'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/admin/getDashboardCount',
    async handler(request, reply) {
      const headers = request.headers;
      const data = await controllers.AdminController.getDashboardCount(headers);
      return reply(data);
    },
    config: {
      description: 'Get Dashboard Count',
      auth: {
        strategy: 'JwtAuth',
        // scope: ['admin '],
      },
      tags: ['api', 'admin'],
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
  name: 'admins',
};
