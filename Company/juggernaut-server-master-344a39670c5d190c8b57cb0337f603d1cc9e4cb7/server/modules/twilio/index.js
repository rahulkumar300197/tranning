

const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {
  const configs = server.plugins['core-config'];
  const controllers = server.plugins['core-controller'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route([
    {
      method: 'POST',
      path: '/twilio/customerVoiceCall',
      async handler(request, reply) {
        const payloadData = request.payload;
        const userData = request.auth.credentials.UserSession.user || null;
        const headers = request.headers;
        const data = await controllers.TwilioController.voiceCallByCustomer(payloadData, userData, headers);
        return reply(data);
      },
      config: {
        description: 'Voice Call By Customer',
        tags: ['api', 'twilio'],
        auth: {
          strategy: 'JwtAuth',
          // scope: 'customer',
        },
        validate: {
          payload: {
            serviceProviderId: Joi.string().required(),
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
      path: '/twilio/supplierVoiceCall',
      async handler(request, reply) {
        const payloadData = request.payload;
        const userData = request.auth.credentials.UserSession.user || null;
        const headers = request.headers;
        const data = await controllers.TwilioController.voiceCallByServiceProvider(payloadData, userData, headers);
        return reply(data);
      },
      config: {
        description: 'Voice Call By Supplier',
        tags: ['api', 'twilio'],
        auth: {
          strategy: 'JwtAuth',
          // scope: 'serviceProvider',
        },
        validate: {
          payload: {
            userId: Joi.string().required(),
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
  ]);
  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'twilio',
};
