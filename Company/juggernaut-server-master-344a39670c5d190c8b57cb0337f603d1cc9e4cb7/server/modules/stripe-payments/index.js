const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];

  server.route({
    method: 'POST',
    path: '/stripe/chargeCreditCard',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.chargeCreditCard(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          stripeCustomerId: Joi.string().required(),
          amount: Joi.string().required(),
          currency: Joi.string().optional(),
          userId: Joi.string().optional(),
        },
      },
      description: 'Charge Amount From Card',
      tags: ['api', 'stripePay'],
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },

  });


  server.route({
    method: 'POST',
    path: '/stripe/createStripeCustomer',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.StripeController.createStripeCustomer(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          cardTokenToCharge: Joi.string().required(),
          email: Joi.string().required(),
        },
      },
      description: 'Create Customer For Stripe',
      tags: ['api', 'stripePay'],
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
    path: '/stripe/addCard',
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.addCard(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          cardTokenToUse: Joi.string().required(),
          stripeCustomerId: Joi.string().required(),
        },
      },
      description: 'Update Stripe Customer',
      tags: ['api', 'stripePay'],
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });


  server.route({
    method: 'DELETE',
    path: '/stripe/deleteStripeCustomer',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.deleteCustomer(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          stripeCustomerId: Joi.string().required(),
        },
      },
      description: 'Delete Customer From Stripe',
      tags: ['api', 'stripePay'],
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
    path: '/stripe/makePayment',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.makePayment(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          stripeCustomerId: Joi.string().required(),
          amountToCharge: Joi.string().required(),
          cardId: Joi.string().required(),
          currency: Joi.string().optional(),
        },
      },
      description: 'Make Payment From Stripe',
      tags: ['api', 'stripePay'],
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },

  });

  server.route({
    method: 'DELETE',
    path: '/stripe/deleteCard',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.cardDelete(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          stripeCustomerId: Joi.string().required(),
          cardId: Joi.string().required(),
        },
      },
      description: 'Delete Card For Customer',
      tags: ['api', 'stripePay'],
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
    path: '/stripe/updateDefaultCard',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.updateDefaultCard(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          stripeCustomerId: Joi.string().required(),
          cardId: Joi.string().required(),
        },
      },
      description: 'Update Default Card For Customer',
      tags: ['api', 'stripePay'],
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
    path: '/stripe/checkUniqueCard',
    async  handler(request, reply) {
      const queryData = request.query;
      const headers = request.headers;
      const data = await controllers.StripeController.cardCheckUnique(headers, queryData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          cardToken: Joi.string().required(),
        },
      },
      description: 'Check Unique Card For Customer',
      tags: ['api', 'stripePay'],
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
    path: '/stripe/makeHoldPayment',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.makeHoldPayment(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          description: Joi.string().required(),
          amountToCharge: Joi.string().required(),
          stripeCustomerId: Joi.string().required(),
          cardId: Joi.string().required(),
        },
      },
      description: 'Make Hold Payment ',
      tags: ['api', 'stripePay'],
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
    path: '/stripe/makeChargeForHoldPayment',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.makeChargeForHoldPayment(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          chargeId: Joi.string().required(),
          amount: Joi.string().required(),
        },
      },
      description: 'Make charge for hold payment',
      tags: ['api', 'stripePay'],
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
    path: '/stripe/partialRefundAmount',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.partialRefundAmount(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          chargeId: Joi.string().required(),
          amount: Joi.string().required(),
        },
      },
      description: 'Refund Partial Amount',
      tags: ['api', 'stripePay'],
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
    path: '/stripe/fullyRefundAmount',
    async  handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.StripeController.fullyRefundAmount(headers, payloadData);
      return reply(data);
    },
    config: {
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          chargeId: Joi.string().required(),
        },
      },
      description: 'Refund Full Amount',
      tags: ['api', 'stripePay'],
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
  name: 'stripe-payments',
};
