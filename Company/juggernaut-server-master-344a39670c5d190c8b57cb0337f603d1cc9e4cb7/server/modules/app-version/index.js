const Joi = require('joi');
const Boom = require('boom');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route({
    method: 'GET',
    path: '/appVersion/getCurrentVersions',
    async handler(request, reply) {
      const headers = request.headers;
      const data = await controllers.AppVersionController.getAppVerions(headers);
      return reply(data);
    },
    config: {
      description: 'get current versions of app',
      tags: ['api', 'appVersion'],
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
    path: '/appVersion/setAppVersions',
    async handler(request, reply) {
      const headers = request.headers;
      if (request.payload.latestIOSVersion <= request.payload.criticalIOSVersion
        || request.payload.latestAndroidVersion <= request.payload.criticalAndroidVersion
        || request.payload.latestWebID <= request.payload.criticalWebID) {
        return reply(Boom.badRequest(configs.MessageConfiguration.get('/CRITICAL_VERSION')));
      }
      const data = await controllers.AppVersionController.setAppVersions(headers, request.payload);
      return reply(data);
    },

    config: {
      description: 'set current and critical versions for apps',
      auth: {
        strategy: 'JwtAuth',
        // scope: ['admin'],
      },
      tags: ['api', 'appVersion'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          latestIOSVersion: Joi.number().required().description('Latest IOS version'),
          latestAndroidVersion: Joi.number().required().description('Latest Android Version'),
          latestWebID: Joi.number().optional().required('Latest Web Id'),
          criticalAndroidVersion: Joi.number().required().description('Critical Android Version'),
          criticalIOSVersion: Joi.number().required().description('Critical IOS Version'),
          criticalWebID: Joi.number().required().description('Critical Web Id'),
          updateMessageAtPopup: Joi.string().required().description('Update message to be shown in Popup'),
          updateTitleAtPopup: Joi.string().required().description('Email of the person'),
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
    path: '/appVersion/checkCriticalAppVersions',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.AppVersionController.checkCriticalAppVersions(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Check criticality of app',
      tags: ['api', 'appVersion'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          currentVersion: Joi.string().trim().required().description('Current Version of App'),
          deviceType: Joi.string().required().description('Type of the Device').valid([
            'WEB',
            'ANDROID',
            'IOS',
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

  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'appVersions',
};
