const Joi = require('joi');

const internals = {};


internals.applyRoutes = function (server, next) {
  const configs = server.plugins['core-config'];
  const controllers = server.plugins['core-controller'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  const appConfiguration = configs.AppConfiguration;


  // addSchedule

  server.route([{
    method: 'POST',
    path: '/Schedule/addSchedule',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      payloadData.utcOffset = request.auth.credentials.UserSession.user.utcoffset;
      payloadData.serviceProviderID = request.auth.credentials.UserSession.user._id;
      const data = await controllers.ScheduleController.addSchedule(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Add schedule for service by SP',
      auth: {
        strategy: 'JwtAuth',
        // scope: ['serviceProvider'],
      },
      tags: ['api', 'schedule'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          serviceID: Joi.string().length(24).description('unique id of service').required(),
          startTime: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]+$/).trim().max(5).required()
            .description('HH:MM in local time'),
          endTime: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]+$/).trim().max(5).required()
            .description('HH:MM in local time'),
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
  }]);


  // updateSchedule
  server.route({
    method: 'PUT',
    path: '/Schedule/updateSchedule',
    async handler(request, reply) {
      const payloadData = request.payload;
      payloadData.ip = request.info.remoteAddress;
      const headers = request.headers;
      payloadData.utcOffset = request.auth.credentials.UserSession.user.utcoffset;
      payloadData.serviceProviderID = request.auth.credentials.UserSession.user._id;
      // payloadData.dayOfWeek = payloadData.dayOfWeek.toLowerCase();
      const data = await controllers.ScheduleController.updateSchedule(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Update Schedule',
      auth: {
        strategy: 'JwtAuth',
        // scope: 'serviceProvider',
      },
      tags: ['api', 'schedule'],
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
          scheduleID: Joi.string().length(24).description('unique id of schedule').required(),
          startTime: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]+$/).trim().max(5).required()
            .description('HH:MM in local time'),
          endTime: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]+$/).trim().max(5).required()
            .description('HH:MM in local time'),
          //  dayOfWeek:Joi.string().trim().required()
        },
        failAction: universalFunctions.failActionFunction,
      },
    },
  });

  // getSchedule

  server.route({
    method: 'GET',
    path: '/Schedule/getAllSchedule',
    async handler(request, reply) {
      const payloadData = request.query;
      payloadData.ip = request.info.remoteAddress;
      const headers = request.headers;
      payloadData.utcOffset = request.auth.credentials.UserSession.user.utcoffset;

      // payloadData.dayOfWeek = payloadData.dayOfWeek.toLowerCase();
      const data = await controllers.ScheduleController.getAllSchedule(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Get all schedule particular to service/time',
      auth: {
        strategy: 'JwtAuth',
      },
      tags: ['api', 'schedule'],
      state: {
        parse: false, // parse and store in request.state
        failAction: 'ignore', // may also be 'ignore' or 'log'
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          serviceID: Joi.string().length(24).description('unique id of service'),
          startTime: Joi.string().trim().max(5).description('HH:MM in local time'),
          endTime: Joi.string().trim().max(5).description('HH:MM in local time'),
          isDeleted: Joi.any().allow(['all', true, false]).required(),
          limit: Joi.number().integer().optional().description('limit data in response'),
          skip: Joi.number().integer().optional().description('limit data from response'),
          //  dayOfWeek:Joi.string().trim().required()
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
  }

  );

  // toggleAvailability

  server.route({
    method: 'POST',
    path: '/Schedule/toggleAvailability',
    async handler(request, reply) {
      const payloadData = request.payload;
      payloadData.ip = request.info.remoteAddress;
      const headers = request.headers;
      payloadData.serviceProviderID = request.auth.credentials.UserSession.user._id;
      const data = await controllers.ScheduleController.toggleAvailability(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Toggle availability by SP for a service',
      auth: {
        strategy: 'JwtAuth',
        // scope: 'serviceProvider',
      },
      tags: ['api', 'schedule'],
      state: {
        parse: false, // parse and store in request.state
        failAction: 'ignore', // may also be 'ignore' or 'log'
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          serviceID: Joi.string().length(24).description('unique id of service').required(),
          isAvailable: Joi.boolean().required(),
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
  }

  );

  // checkSchedule

  server.route({
    method: 'POST',
    path: '/Schedule/checkSchedule',
    async handler(request, reply) {
      const payloadData = request.payload;
      payloadData.ip = request.info.remoteAddress;
      //  payloadData.dayOfWeek = payloadData.dayOfWeek.toLowerCase();
      const headers = request.headers;
      const data = await controllers.ScheduleController.checkSchedule(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'check schedule for availability of service by particular SP',
      auth: false,
      tags: ['api', 'schedule'],
      state: {
        parse: false, // parse and store in request.state
        failAction: 'ignore', // may also be 'ignore' or 'log'
      },
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          serviceID: Joi.string().length(24).description('unique id of service').required(),
          serviceProviderID: Joi.string().length(24)
            .description('unique id of SP profile').required(), //  dayOfWeek:Joi.string().trim().required()
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
  }

  );


  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'users', 'core-controller', 'core-models', 'core-config',
    'core-utility-functions', 'core-services',
  ], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'schedule',
};
