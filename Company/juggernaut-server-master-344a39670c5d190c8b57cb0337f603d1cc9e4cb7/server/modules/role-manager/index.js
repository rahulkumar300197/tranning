const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route([{
    method: 'GET',
    path: '/role/getAllRoles', // needs to be more specific
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.RoleController.getAllRoles(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'get all role',
      tags: ['api', 'roles'],
      auth: {
        strategy: 'JwtAuth',
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          limit: Joi.number().integer().optional().description('limit data in response'),
          skip: Joi.number().integer().optional().description('limit data from response'),
        },
        failAction: universalFunctions.failActionFunction,
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
  name: 'role',
};
