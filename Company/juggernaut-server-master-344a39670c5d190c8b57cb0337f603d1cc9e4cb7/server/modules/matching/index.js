

const Joi = require('joi');
const Boom = require('boom');

const internals = {};


internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  let categoryParentID = null;

  server.route([{
    method: 'POST',
    path: '/matching/categoryAvailLocation', // needs to be more specific
    config: {
      description: 'update location availability for category',
      tags: ['api', 'matching'],
      auth: {
        strategy: 'JwtAuth',
        // scope: 'admin',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          categoryID: Joi.string().min(24).max(24).required(),
          coordinates: Joi.array().items(Joi.array().items(Joi.number().required()).required()).min(4).required()
            .description('[[0,0],[1,1],[2,2],[0,0]]'),
          geoLocationRegionName: Joi.string().required().description('name for coordinates'),
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
        assign: 'preValidationChecks',
        async method(request, reply) {
          // try {
          const payloadData = request.payload;
          const headers = request.headers;
          const data = await controllers.MatchingController.preValidationChecks(headers, payloadData);
          if (data.parentID) {
            categoryParentID = result.parentID;
          }
          return reply(true);
          // } catch (error) { return error; }
        },
      }],
    },
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      payloadData.parentID = categoryParentID;
      if (!request.payload.coordinates) {
        return reply(Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INSERT_CITY' })));
      } else if (request.payload.coordinates && !request.payload.geoLocationRegionName) {
        return reply(Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INSERT_GEO_LOCATION_REGION_NAME' })));
      }
      const data = await controllers.MatchingController.addCategoryAvailLocation(headers, payloadData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'GET',
    path: '/matching/listAllCategoryLocations', // needs to be more specific
    config: {
      description: 'update location availability for category',
      tags: ['api', 'matching'],
      auth: {
        strategy: 'JwtAuth',
        // scope: 'admin',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          parentID: Joi.string().optional().description('parentID of category'),
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
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.MatchingController.listAllCategoryLocations(headers, queryData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'GET',
    path: '/matching/listAllCategoriesInRange', // needs to be more specific
    config: {
      description: 'update location availability for category',
      tags: ['api', 'matching'],
      auth: {
        strategy: 'JwtAuth',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          parentID: Joi.string().optional().description('parentID of category'),
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
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.MatchingController.listAllCategoriesInRange(headers, queryData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'POST',
    path: '/matching/serviceAvailLocation', // needs to be more specific
    config: {
      description: 'update location availability for category',
      tags: ['api', 'matching'],
      auth: {
        strategy: 'JwtAuth',
        // scope: 'admin',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          serviceID: Joi.string().required(),
          coordinates: Joi.array().items(Joi.array().items(Joi.number().required()).required()).min(4).required()
            .description('[[0,0],[1,1],[2,2],[0,0]]'),
          geoLocationRegionName: Joi.string().required().description('name for coordinates'),
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
        assign: 'preValidationChecks',
        async method(request, reply) {
          const payloadData = request.payload;
          const headers = request.headers;
          const data = await controllers.MatchingController.preValidationServiceChecks(headers, payloadData);
          if (data.parentID) {
            categoryParentID = data.parentCategory;
          }
          reply(true);
        },
      }],
    },
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      payloadData.parentID = categoryParentID;
      if (!request.payload.coordinates) {
        return reply(Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INSERT_CITY' })));
      } else if (request.payload.coordinates && !request.payload.geoLocationRegionName) {
        return reply(Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INSERT_GEO_LOCATION_REGION_NAME' })));
      }
      const data = await controllers.MatchingController.addServiceAvailLocation(headers, payloadData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'GET',
    path: '/matching/listAllServicesLocations', // needs to be more specific
    config: {
      description: 'update location availability for category',
      tags: ['api', 'matching'],
      auth: {
        strategy: 'JwtAuth',
        // scope: 'admin',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          parentID: Joi.string().optional().min(24).max(24).description('parentID of category'),
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
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.MatchingController.listAllServicesLocations(headers, queryData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'GET',
    path: '/matching/listAllServicesInRange', // needs to be more specific
    config: {
      description: 'update location availability for category',
      tags: ['api', 'matching'],
      auth: {
        strategy: 'JwtAuth',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          parentID: Joi.string().optional().min(24).max(24).description('parentID of category'),
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
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.MatchingController.listAllServicesInRange(headers, queryData);
      return reply(data);
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
  name: 'matching',
};
