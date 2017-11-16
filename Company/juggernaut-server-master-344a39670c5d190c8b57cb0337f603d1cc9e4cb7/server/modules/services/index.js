

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
      path: '/service/addCategory',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.ServiceController.addCategory(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'Create New Category or Service',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['admin'],
        },
        tags: ['api', 'service'],
        payload: {
          maxBytes: 2000000,
          parse: true,
          output: 'file',
          timeout: false,
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            categoryName: Joi.string().required(),
            parentID: Joi.string().optional(),
            icon: Joi.any()
              .meta({
                swaggerType: 'file',
              })
              .optional()
              .description('category icon file'),
            description: Joi.string().min(20).max(200).required().description('length of description should be in between 20 to 200'),
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
      path: '/service/getAllCategory',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.query;
        const data = await controllers.ServiceController.getAllCategory(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'get all category',
        tags: ['api', 'service'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            isDeleted: Joi.any().allow(['all', true, false]).required(),
            parentID: Joi.string().optional().description('NULL to get only top most categories'),
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
      method: 'PUT',
      path: '/service/updateCategory',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.ServiceController.updateCategory(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'get all category',
        tags: ['api', 'service'],
        auth: {
          strategy: 'JwtAuth',
          // scope: ['admin'],
        },
        payload: {
          maxBytes: 2000000,
          parse: true,
          output: 'file',
          timeout: false,
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            categoryID: Joi.string().required().min(24).max(24).description('unique id of category or sub category'),
            categoryName: Joi.string().optional(),
            parentID: Joi.string().optional(),
            icon: Joi.any()
              .meta({
                swaggerType: 'file',
              })
              .optional()
              .description('category icon file'),
            description: Joi.string().min(20).max(200).optional().description('length of description should be in between 20 to 200'),

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
      method: 'DELETE',
      path: '/service/deleteCategory',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.ServiceController.deleteCategory(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'delete category',
        tags: ['api', 'service'],
        auth: {
          strategy: 'JwtAuth',
          // scope: ['admin'],
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            categoryID: Joi.string().required().min(24).max(24).description('unique id of category or sub category'),
            isDeleted: Joi.boolean().required(),
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
      method: 'POST',
      path: '/service/addService',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.ServiceController.addService(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'Create New Service',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['admin'],
        },
        tags: ['api', 'service'],
        payload: {
          maxBytes: 2000000,
          parse: true,
          output: 'file',
          timeout: false,
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            parentCategory: Joi.string().length(24).required().description('Add parentCategory Object ID'),
            serviceName: Joi.string().required(),
            imageUrl: Joi.any()
              .meta({
                swaggerType: 'file',
              })
              .optional()
              .description('service image file'),
            description: Joi.string().min(20).max(200).required().description('length of description should be in between 20 to 200'),
            baseCost: Joi.number(),
            durationInMinutes: Joi.number(),
            tags: Joi.array().items(Joi.string().required()).description('Add tags for service'),
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
      method: 'PUT',
      path: '/service/updateService',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.ServiceController.updateService(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'Update Service',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['admin'],
        },
        tags: ['api', 'service'],
        payload: {
          maxBytes: 2000000,
          parse: true,
          output: 'file',
          timeout: false,
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            serviceID: Joi.string().length(24).required().description('unique id of service'),
            parentCategory: Joi.string().length(24).optional().description('Add parentCategory Object ID'),
            serviceName: Joi.string().optional(),
            imageUrl: Joi.any()
              .meta({
                swaggerType: 'file',
              })
              .optional()
              .description('service image file'),
            description: Joi.string().min(20).max(200).optional().description('length of description should be in between 20 to 200'),
            baseCost: Joi.number(),
            durationInMinutes: Joi.number(),
            tags: Joi.array().items(Joi.string().optional()).description('Add tags for service'),
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
      method: 'DELETE',
      path: '/service/deleteService',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.ServiceController.deleteService(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'delete service',
        tags: ['api', 'service'],
        auth: {
          strategy: 'JwtAuth',
          // scope: ['admin'],
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            serviceID: Joi.string().required().min(24).max(24).description('unique id of category or sub category'),
            isDeleted: Joi.boolean().required(),
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
      path: '/service/listAllService',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.query;
        const data = await controllers.ServiceController.getAllService(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'get all services or for certain category',
        tags: ['api', 'service'],
        auth: {
          strategy: 'JwtAuth',
          // scope: ['admin'],
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            isDeleted: Joi.any().allow(['all', true, false]).required(),
            parentCategory: Joi.string().optional(),
            isApproved: Joi.any().allow(['all', true, false]).required(),
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
      method: 'PUT',
      path: '/serviceProvider/registerForService',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = request.auth.credentials.UserSession;
        const data = await controllers.ServiceController.registerForService(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Register for service',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'serviceProvider'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            serviceID: Joi.string().length(24).required().description('unique id of service'),
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
      method: 'PUT',
      path: '/admin/approveServiceRequest',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.ServiceController.approveServiceRequest(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'approve SP request for service',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['admin'],
        },
        tags: ['api', 'admin'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            serviceID: Joi.string().length(24).required().description('unique id of service'),
            userID: Joi.string().length(24).required().description('unique id or user'),
            isApproved: Joi.boolean().required(),
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
  name: 'services',
};
