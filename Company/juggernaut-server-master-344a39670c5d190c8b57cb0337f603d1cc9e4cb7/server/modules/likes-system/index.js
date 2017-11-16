const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;


  server.route([{
    method: 'POST',
    path: '/like/likeOrUnlikeComment', // needs to be more specific
    config: {
      description: 'like or unlike comment',
      tags: ['api', 'likeOrUnlikeComment'],
      auth: 'JwtAuth',
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
          // user: Joi.string().required(),
          commentID: Joi.string().required(),
          likeLevel: Joi.number().optional().max(5).default(0),
          // entityId: Joi.string().optional()
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
    async handler(request, reply) {
      const payloadData = request.payload;
      const session = request.auth.credentials.UserSession;
      const userData = (session && session.user && session.user._id) || null;
      const headers = request.headers;
      const data = await controllers.LikeController.likeOrUnlikeComment(headers, payloadData, userData);
      return reply(data);
      // reply(universalFunctions.sendSuccess(null, data, lang));
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
  name: 'likes',
};
