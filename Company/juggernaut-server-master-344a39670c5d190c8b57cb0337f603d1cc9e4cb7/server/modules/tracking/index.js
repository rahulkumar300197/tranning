

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
      method: 'PUT',
      path: '/driver/updateLocation',
      async handler(request, reply) {
        const userData = request.auth.credentials.UserSession.user || null;
        const payloadData = request.payload;
        const headers = request.headers;
        const data = await controllers.TrackingController.updateDriverLocation(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Driver Location Update',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'driver'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          failAction: universalFunctions.failActionFunction,
          payload: {
            isTrackingOn: Joi.any().allow([true, false]).required(),
            currentLocation: Joi.object().keys({
              type: Joi.string().valid(['Point']).required(),
              longitude: Joi.number().min(-180).max(180).precision(6).required(),
              latitude: Joi.number().min(-90).max(90).precision(6).required(),
            }),
          },

        },
        plugins: {
          'hapi-swagger': {
            // payloadType: 'form',
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    },
  ]);

  server.route([
    {
      method: 'GET',
      path: '/tracking/getUserTrackingData',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.TrackingController.getUserTracking(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Get path for specific user',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'tracking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            userID: Joi.string().required().min(24).max(24).description('user ID'),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: appConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    },
  ]);

  server.route([
    {
      method: 'POST',
      path: '/tracking/enrouteDriver',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.TrackingController.startBookingTracking(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'upload tracking history',
        tags: ['api', 'tracking'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            bookingID: Joi.string().required().min(24).max(24).description('Booking ID to track'),
            customerID: Joi.string().required().min(24).max(24).description('Customer ID that belongs to booking'),
            driverID: Joi.string().required().min(24).max(24).description('driver to be tracked'),
            driverName: Joi.string().required().description('Name of the driver'),
            routes: Joi.object().keys({
              latitude: Joi.number().min(-180).max(180).precision(8).required(),
              longitude: Joi.number().min(-90).max(90).precision(8).required(),
              accuracy: Joi.number().precision(8).required(),
            }),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            // payloadType: 'form',
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    },
  ]);

  server.route([
    {
      method: 'POST',
      path: '/tracking/uploadTrackFiletoS3',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.TrackingController.uploadTrackHistorytoS3(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'upload tracking history to S3',
        tags: ['api', 'tracking'],
        auth: {
          strategy: 'JwtAuth',
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
            bookingID: Joi.string().required().min(24).max(24).description('Booking ID to track'),
            trackHistoryFile: Joi.any().meta({ swaggerType: 'file' }).required().description('track history file'),
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
      path: '/booking/getBookingRoute',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.TrackingController.getRouteforBooking(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Get path for specific booking',
        auth: false,
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            bookingID: Joi.string().required().min(24).max(24).description('Booking ID to fetch the track history'),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
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
  name: 'tracking',
};
