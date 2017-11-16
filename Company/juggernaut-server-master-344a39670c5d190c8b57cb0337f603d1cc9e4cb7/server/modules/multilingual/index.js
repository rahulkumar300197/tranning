const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route([{
    method: 'POST',
    path: '/multilingual/addLocale',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.MultilingualController.addLocale(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'add new language',
      tags: ['api', 'multilingual'],
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
        payload: {
          locale: Joi.string().required().description('locale id'),
          localeName: Joi.string().required().description('message key'),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
  },
  ]);

  server.route({
    method: 'GET',
    path: '/multilingual/getAllLocales',
    async handler(request, reply) {
      const data = await controllers.MultilingualController.getAllLocales();
      return reply(data);
    },
    config: {
      description: 'get all available locales data',
      tags: ['api', 'multilingual'],
      validate: {
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
    path: '/multilingual/controlLocale',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.MultilingualController.controlLocale(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
        payload: {
          locale: Joi.string().required().description('locale en/ar'),
          isActive: Joi.boolean().required().description('locale is on or off for portal'),
        },
      },
      auth: {
        strategy: 'JwtAuth',
      },
      description: 'Disable Enable language',
      tags: ['api', 'multilingual'],
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
    path: '/multilingual/addResourceBundle',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.MultilingualController.addApplicationURIs(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
        payload: {
          locale: Joi.string().required().description('locale en/ar'),
          messageKey: Joi.string().required().description('message key'),
          customMessage: Joi.string().required().description('value key'),
        },
      },
      auth: {
        strategy: 'JwtAuth',
      },
      description: 'Insert new key value pair for locale',
      tags: ['api', 'multilingual'],
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
    path: '/multilingual/getAllResourceBundle',
    async handler(request, reply) {
      const headers = request.headers;
      const data = await controllers.MultilingualController.getApplicationURIs(headers);
      return reply(data);
    },
    config: {
      description: 'get all available locales data',
      tags: ['api', 'multilingual'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
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
    path: '/multilingual/addBackendMessages',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.MultilingualController.addBackendMessages(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
        payload: {
          locale: Joi.string().required().description('locale ar/en'),
          messageKey: Joi.string().required().description('message key'),
          customMessage: Joi.string().required().description('value key'),
        },
      },
      auth: {
        strategy: 'JwtAuth',
      },
      description: 'api to change backend messages',
      tags: ['api', 'multilingual'],
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
  name: 'multilingual',
};
