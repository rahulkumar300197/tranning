const Extension = require('joi-date-extensions');
const Joi = require('joi');

const BaseJoi = Joi.extend(Extension);


const internals = {};
internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route({
    method: 'POST',
    path: '/stripe/createCardToken',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.stripeController.createCardToken(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'For creating card token',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          number: Joi.string().required().description('5200828282828210 for testing'),
          expMonth: Joi.number().required().description('12 for testing'),
          expYear: Joi.number().required().description('18 for testing'),
          cvc: Joi.string().required(),
          currency: Joi.string().required().description('usd'),


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
    path: '/stripe/createBankAccountToken',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.stripeController.createBankAccountToken(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'For Creating External Account',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          accountHolderName: Joi.string(),
          accountNumber: Joi.string().required().description('000123456789 for testing'),
          country: Joi.string().required().description('US for testing'),
          currency: Joi.string().required().description('usd for testing'),
          routingNumber: Joi.string().required().description('110000000 for testing'),
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
    path: '/stripe/verificationFileUpload',
    async handler(request, reply) {
      const headers = request.headers;
      const data = await controllers.stripeController.fileUpload(headers);
      return reply(data);
    },
    config: {
      description: 'For file uploading / verification step 1',
      tags: ['api', 'stripeConnect'],
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
    path: '/stripe/createManagedAccount',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.stripeController.createUser(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'For creating Managed Account',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          managed: Joi.string().required().description('true or false'),
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          type: Joi.string().required().description('individual'),
          email: Joi.string().required(),
          dob: BaseJoi.date().format('DD-MM-YYYY').required().description('DD-MM-YYYY'),
          country: Joi.string().required().description('US for testing'),
          object: Joi.string().required().description('bank_account or card'),
          accountNumber: Joi.string().required().description('000123456789 for tetsting'),
          routingNumber: Joi.string().required().description('110000000'),
          currency: Joi.string().required().description('usd'),
          ip: Joi.string().required(),
          postalCode: Joi.string().required().description('94107 for testing'),
          street: Joi.string().required(),
          city: Joi.string().required().description('san francisco for testing'),
          state: Joi.string().required().description('CA'),
          ssnLast4: Joi.string().required().description('1234'),
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
    method: 'PUT',
    path: '/stripe/updateAccount',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.stripeController.update(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'For updating Account/ verification step 2',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          fileCode: Joi.string().required(),
          personalNumber: Joi.number().required().description('987654321 for testing'),
          accountKey: Joi.string().required().description('customer account key'),
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
    path: '/stripe/createCard',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.stripeController.createCard(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'For creating card',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          accountKey: Joi.string().required().description('customer account key'),
          cardToken: Joi.string().required(),
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
    path: '/stripe/createBankAccount',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.stripeController.createBankAccount(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'For Creating External Account',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          accountKey: Joi.string().required().description('customer account key'),
          bankToken: Joi.string().required(),
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
    path: '/stripe/createCharge',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.stripeController.createCharge(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'For Creating charge',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          amount: Joi.number().required(),
          currency: Joi.string().required(),
          applicationFee: Joi.number().required(),
          source: Joi.string().required().description('customer ID').description('customer account key'),
          description: Joi.string().required(),
          destination: Joi.string().required().description('customer ID').description('customer account key'),
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
    method: 'GET',
    path: '/stripe/getuser',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.stripeController.getUser(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'For Fetching Account Details',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          accountKey: Joi.string().required().description('customer account key'),
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
    method: 'GET',
    path: '/stripe/getAccountBalance',
    async handler(request, reply) {
      const headers = request.headers;
      const data = await controllers.stripeController.getAccountBalance(headers);
      return reply(data);
    },
    config: {
      description: 'For getting Account Balance',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
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
    method: 'GET',
    path: '/stripe/getConnectedAccounts',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.stripeController.getConnectedAccount(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'For getting all connected accounts',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          limit: Joi.string().optional(),
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
    method: 'GET',
    path: '/stripe/retriveAllCharges',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.stripeController.listAllCharges(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'For Retriving all charges',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          limit: Joi.string(),
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
    method: 'GET',
    path: '/stripe/retriveCharge',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.stripeController.retriveCharge(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'For Retriving charge',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          chargeID: Joi.string().required().description('charge ID'),
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
    method: 'DELETE',
    path: '/stripe/deleteBankAccount',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.stripeController.deleteBankAccount(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'For delete bank details',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          bankID: Joi.string().required().description('ID of bank'),
          accountKey: Joi.string().required().description('customer account key'),

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
    method: 'DELETE',
    path: '/stripe/deleteAccount',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.stripeController.deleteAccount(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'For deleting Account',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          accountKey: Joi.string().required().description('customer account key'),
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
    method: 'GET',
    path: '/stripe/retriveBankAccount',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      const data = await controllers.stripeController.retriveBankAccount(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'For Retriving bank details',
      tags: ['api', 'stripeConnect'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          bankID: Joi.string().required().description('ID of bank'),
          accountKey: Joi.string().required().description('customer account key'),
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
  name: 'stripe-connect',
};
