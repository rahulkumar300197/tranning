const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route({
    method: 'POST',
    path: '/social/login',
    async handler(request, reply) {
      const headers = request.headers;
      const data = await controllers.SocialController.socialLogin(headers, request.payload);
      return reply(data);
    },

    config: {
      description: 'set current and critical versions for apps',
      tags: ['api', 'social'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          role: Joi.string().required()
            .valid([
              configs.UserConfiguration.get('/roles', { role: 'customer' }),
              configs.UserConfiguration.get('/roles', { role: 'driver' }),
              configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
            ]).description('role of user'),
          latitude: Joi.number().min(-90).max(90).optional(),
          longitude: Joi.number().min(-180).max(180).optional(),
          appVersion: Joi.string().trim(),
          deviceToken: Joi.string().optional().allow(''),
          deviceType: Joi.string().required().description('type of the device current using')
            .valid([configs.UserConfiguration.get('/deviceTypes', { type: 'web' }),
              configs.UserConfiguration.get('/deviceTypes', { type: 'ios' }),
              configs.UserConfiguration.get('/deviceTypes', { type: 'android' }),
            ]),
          socialType: Joi.string().required()
            .valid([
              configs.UserConfiguration.get('/social', { type: 'facebook' }),
              configs.UserConfiguration.get('/social', { type: 'google' }),
              // configs.UserConfiguration.get('/social', { type: 'linkedIn' }),
              // configs.UserConfiguration.get('/social', { type: 'twitter' }),
            ]).description('social media type'),
          socialID: Joi.string().trim().required(), // .description('Either facebookID/googleID/twitterID/linkedIN'),
          accessToken: Joi.string().required().description('access token to verify the user'),
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
  name: 'social',
};
