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
      path: '/review/giveReviewAndRating',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
        };
        if (userData.userID === payloadData.userID) {
          return reply(configs.MessageConfiguration.get('/lang', { locale: headers['content-language'], message: 'RATING_REVIEWER_SAME' }));
        }
        const data = await controllers.ReviewController.giveReviewRating(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Review and Rating for Driver',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'review'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            userID: Joi.string().min(24).max(24).required().description('userID to be reviewed'),
            bookingID: Joi.string().min(24).max(24).required().description('booking ID to which booking belongs'),
            review: Joi.string().trim().min(5).optional().description('Review'),
            rating: Joi.number().min(1).max(10).required().description('Rating'),
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

  server.route([
    {
      method: 'GET',
      path: '/review/listDetailedReview',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
        };
        const data = await controllers.ReviewController.listDetailedReview(headers, queryData, userData);
        return reply(data);
      },
      config: {
        description: 'Review and Rating for Driver',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'review'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            userID: Joi.string().min(24).max(24).description('userID of user to list reviews'),
            bookingID: Joi.string().min(24).max(24).description('booking ID to which booking belongs'),
            showOnlyMyReviws: Joi.boolean().default(false).required()
              .description('true to list only reviews done by user else all the reviews based on booking or other users'),
            limit: Joi.number().integer().optional().description('limit data in response'),
            skip: Joi.number().integer().optional().description('limit data from response'),
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

  server.route([
    {
      method: 'GET',
      path: '/review/listAverageRating',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.ReviewController.listAverageRating(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Review and Rating for Driver',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'review'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            userID: Joi.string().min(24).max(24).description('list average reviews of single user only'),
            limit: Joi.number().integer().optional().description('limit data in response'),
            skip: Joi.number().integer().optional().description('limit data from response'),
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
  server.dependency(['auth', 'users', 'core-controller', 'core-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'review',
};
