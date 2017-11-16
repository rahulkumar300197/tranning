const Joi = require('joi');
const _ = require('underscore');
const Boom = require('boom');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const services = server.plugins['core-services'];
  const universalFunctions = utilityFunctions.universalFunction;

  /* ****************************************************************************
   * Authorization Engine Middleware for Authorization of Routes and Attributes *
   ***************************************************************************** */
  server.ext({
    type: 'onPostAuth',
    async method(request, reply) {
      try {
        let objectRights = [];
        let completeAccess;
        if (request.headers.authorization && !request.auth.credentials) {
          throw Boom.forbidden(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'PUBLIC_RESOURCE_TOKEN_ERROR' }));
        }

        const role = (request.auth.credentials && request.auth.credentials.scope) || null;
        if (role) {
          const key = request.method + request.path;
          let redisData = await services.RedisService.getData(key);
          redisData = JSON.parse(redisData);
          if (redisData && redisData.permission) {
            let isAllowed = false;
            for (let i = 0; i < redisData.permission.length; i += 1) {
              if (redisData.permission[i].role === role) {
                objectRights = redisData.permission[i].objectRights;
                completeAccess = redisData.permission[i].completeAccess;
                isAllowed = true;
              }
            }
            if (!isAllowed) {
              throw Boom.forbidden(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'NOT_AUTHORIZED_ROLE_ACL' }));
            }
          } else {
            throw Boom.forbidden(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'NOT_AUTHORIZED_ROLE_ACL' }));
          }
        }
        if (completeAccess || !request.headers.authorization) {
          return reply.continue();
        }
        const getRequestData = request.query || null;
        const otherMethodData = request.payload || null;
        let requestKeyValues = '';
        const data = [];
        if (Object.keys(getRequestData).length > 0) {
          const getRequestDataKeys = Object.keys(getRequestData);
          if (getRequestDataKeys.length < 1) {
            return reply.continue();
          }
          let finalData = [];
          getRequestDataKeys.forEach((key) => {
            const value = getRequestData[key];
            requestKeyValues = `${key}:${value}`;
            data.push(requestKeyValues);
            finalData = _.difference(data, objectRights);
          });
          if (finalData.length > 0) {
            throw Boom.forbidden(`${configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'NOT_AUTHORIZED_ROLE_ACL' })} ${finalData}`);
          }
        } else if (otherMethodData) {
          const otherMethodDataKeys = Object.keys(otherMethodData);
          if (otherMethodDataKeys.length < 1) {
            return reply.continue();
          }
          const finalData = _.difference(otherMethodDataKeys, objectRights);
          if (finalData.length > 0) {
            throw Boom.forbidden(`${configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'NOT_AUTHORIZED_ROLE_ACL' })} ${finalData}`);
          }
        }
        return reply.continue();
      } catch (error) {
        winstonLogger.error(`Access token ${request.headers.authorization}has thrown error ${error}`);
        return reply(error);
      }
    },
  });


  // api for admin use only, scope used to handle this above authorization-engine
  server.route([{
    method: 'POST',
    path: '/authorization/addPermission',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userRole = request.auth.credentials.scope;
      const data = await controllers.AclController.addPermission(headers, payloadData, userRole);
      return reply(data);
    },
    config: {
      description: 'add authorization permissions',
      tags: ['api', 'authorization'],
      auth: {
        strategy: 'JwtAuth',
        scope: 'admin',
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
          method: Joi.string().trim().required().description('request method like get/post/update'),
          apiPath: Joi.string().trim().required().description('api name like /acl/addPermission'),
          alias: Joi.string().trim().required().description('unique Name for the api'),
          permissionName: Joi.string().required().description('Name of the permission that will be visible to user'),
          completeAccess: Joi.boolean().required().description('should be true to give complete access to the user'),
          roleAccess: Joi.array().items(Joi.string().required()).required().description("['driver','admin','customer']"),
          allowedToUpdate: Joi.array().items(Joi.string().required()).required().description("['driver','admin','customer']"),
          objectRights: Joi.array().items(Joi.string().optional()).optional().description('If get method ["key:value"] else ["key"]'),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
  },
  ]);

  // api for admin use only, scope used to handle this above authorization-engine
  server.route([{
    method: 'POST',
    path: '/authorization/specificRolePermission',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const userRole = request.auth.credentials.scope;
      const data = controllers.AclController.specificRolePermission(headers, payloadData, userRole);
      return reply(data);
    },
    config: {
      description: 'add authorization permissions',
      tags: ['api', 'authorization'],
      auth: {
        strategy: 'JwtAuth',
        scope: 'admin',
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
          method: Joi.string().trim().required().description('request method like get/post/update'),
          apiPath: Joi.string().trim().required().description('api name like /acl/addPermission'),
          completeAccess: Joi.boolean().required().description('should be true to give complete access to the user'),
          role: Joi.string().required().description('access to specific user'),
          objectRights: Joi.array().items(Joi.string().optional()).optional().description('If get method ["key:value"] else ["key"]'),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
  },
  ]);

  server.route([{
    method: 'GET',
    path: '/authorization/getPermission',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.AclController.getPermission(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'get permission',
      tags: ['api', 'authorization'],
      auth: {
        strategy: 'JwtAuth',
        // scope: 'admin',
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
          method: Joi.string().trim().required().description('request method like get/post/update'),
          apiPath: Joi.string().trim().required().description('api name like /acl/addPermission'),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
  },
  ]);

  server.route([{
    method: 'GET',
    path: '/authorization/getAllPermissions',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.AclController.getAllPermissions(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'get all permissions',
      tags: ['api', 'authorization'],
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
  name: 'authorization',
};
