

const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route([{
    method: 'POST',
    path: '/comment/createTestEntity', // needs to be more specific
    config: {
      description: 'Create a new Entity for testing purpose',
      tags: ['api', 'comment'],
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
          entityText: Joi.string().required().description('entity on which comment to be done like video/image/status'),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.CommentController.addTestEntity(headers, payloadData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'POST',
    path: '/comment/addComment', // needs to be more specific
    config: {
      description: 'Add comment to the Entity',
      tags: ['api', 'comment'],
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
          upperCommentID: Joi.string().optional().description('only in case of reply to specific comment'),
          commentText: Joi.string().required().description('comment'),
          entityID: Joi.string().required().description('entity id'),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
    async handler(request, reply) {
      const session = request.auth.credentials.UserSession;
      const userData = (session && session.user && session.user._id) || null;
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.CommentController.addComment(headers, payloadData, userData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'POST',
    path: '/comment/getCommentsForEntity',
    config: {
      description: 'get comments on entity',
      tags: ['api', 'comment'],
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
          entityID: Joi.string().required().description('entity id'),
          limit: Joi.number().description('limit data in response'),
          skip: Joi.number().description('skip data from response'),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.CommentController.getAllComment(headers, payloadData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'GET',
    path: '/comment/getReplyOnComment', // needs to be more specific
    config: {
      description: 'get reply(ies) on comments',
      tags: ['api', 'comment'],
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
        query: {
          entityID: Joi.string().required().description('entity id'),
          parentCommentID: Joi.string().required(),
          commentLevel: Joi.number().required().description('depth level of reply on comment'),
          limit: Joi.number().description('limit data in response'),
          skip: Joi.number().description('skip data from response'),
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
    async handler(request, reply) {
      const headers = request.headers;
      payloadData = request.query;
      const data = await controllers.CommentController.getReplyOnComment(headers, payloadData);
      return reply(data);
    },
  },
  ]);

  server.route([{
    method: 'DELETE',
    path: '/comment/deleteComment',
    async handler(request, reply) {
      const headers = request.headers;
      payloadData = request.query;
      const data = await controllers.CommentController.deleteComment(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Delete A Comment',
      tags: ['api', 'comment'],
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
        query: {
          entityID: Joi.string().required(),
          commentID: Joi.string().required(),
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
  name: 'comments',
};
