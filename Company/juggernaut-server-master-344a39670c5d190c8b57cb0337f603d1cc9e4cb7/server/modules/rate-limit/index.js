

const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  const appConfiguration = configs.AppConfiguration;

  server.route([
    {
      method: 'POST',
      path: '/rateLimit/setIPAttempt',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.RatingController.setIPAttempt(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'Create New Category or Service',
        auth: {
          strategy: 'JwtAuth',
          // scope: ["admin"]
        },
        tags: ['api', 'rateLimit'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            isEnabled: Joi.boolean().required(),
            userLimit: Joi.number().optional(),
            userLimitExpiresIn: Joi.number().optional(),
            pathLimit: Joi.number().optional(),
            pathLimitExpiresIn: Joi.number().optional(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            payloadType: 'form',
            responseMessages: appConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    },
  ]);

  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'rateLimit',
};
