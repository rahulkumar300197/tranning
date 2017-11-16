const Joi = require('joi');
const Boom = require('boom');

const internals = {};


internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  const appConfiguration = configs.AppConfiguration;
  const bookingConfiguration = configs.BookingConfiguration;

  server.route([
    {
      method: 'POST',
      path: '/bookingAssignment/bookingFloatSetting',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        if (payloadData.reAttempt > 0 && !payloadData.increaseDistanceBy) {
          return reply(Boom.notAcceptable(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INCREASE_DISTANCE_FOR_REATTEMPTS' })));
        }
        const data = await controllers.BookingAssignmentController.addBookingFloatSetting(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'Round settings for booking floating',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'bookingAssignment'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            typeOfAlgo: Joi.string().required().valid([
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'MANUAL' }),
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'BROADCAST' }),
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'ROUND_ROBIN' }),
            ]),
            forWhom: Joi.string().required().valid([
              configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
              configs.AppConfiguration.get('/roles', { role: 'driver' }),
            ]),
            serviceProviderID: Joi.string().min(24).max(24)
              .description('Booking float setting for particular serviceProvider once he accepts bookings and forward booking to drivers'),
            distanceRange: Joi.number().required().description('should be in meters, will be visible'),
            requestExpiresIn: Joi.number().required().description('waiting time for request expires'),
            reAttempt: Joi.number().required().description('Total re attempts if not accepted within time expires'),
            increaseDistanceBy: Joi.number().optional().description('If reattempts are more than 0, for Broadcast, then it is required'),
            percentageHikeInBookingPrice: Joi.number().description('Price hike of booking if failed at first round not for 0th round'),
            adminCutFromBooking: Joi.number().description('Admin percentage cut on booking before floating to service providers'),
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
      path: '/bookingAssignment/updateBookingFloatSetting',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        if (payloadData.reAttempt > 0 && !payloadData.increaseDistanceBy) {
          return reply(Boom.notAcceptable(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INCREASE_DISTANCE_FOR_REATTEMPTS' })));
        }
        const data = await controllers.BookingAssignmentController.updateBookingFloatSetting(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'Update Round settings for booking floating',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'bookingAssignment'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            typeOfAlgo: Joi.string().required().valid([
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'MANUAL' }),
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'BROADCAST' }),
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'ROUND_ROBIN' }),
            ]),
            forWhom: Joi.string().required().valid([
              configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
              configs.AppConfiguration.get('/roles', { role: 'driver' }),
            ]),
            serviceProviderID: Joi.string().min(24).max(24)
              .description('Booking float setting for particular serviceProvider once he accepts bookings and forward booking to drivers'),
            distanceRange: Joi.number().required().description('should be in meters, will be visible'),
            requestExpiresIn: Joi.number().required().description('waiting time for request expires'),
            reAttempt: Joi.number().required().description('Total re attempts if not accepted within time expires'),
            increaseDistanceBy: Joi.number().optional().description('If reattempts are more than 0, for Broadcast, then it is required'),
            percentageHikeInBookingPrice: Joi.number().description('Price hike of booking if failed at first round not for 0th round'),
            adminCutFromBooking: Joi.number().description('Admin percentage cut on booking before floating to service providers'),
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
      path: '/bookingAssignment/listBookingFloatSetting',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.BookingAssignmentController.listBookingFloatSetting(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Round settings for booking floating',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'bookingAssignment'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            typeOfAlgo: Joi.string().optional().valid([
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'MANUAL' }),
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'BROADCAST' }),
              bookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'ROUND_ROBIN' }),
            ]),
            forWhom: Joi.string().optional().valid([
              configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
              configs.AppConfiguration.get('/roles', { role: 'driver' }),
            ]),
            serviceProviderID: Joi.string().min(24).max(24).description('for booking float methods of specific serviceProvider'),
            limit: Joi.number().description('Limit number of records'),
            skip: Joi.number().description('Skip number of records'),
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
      path: '/customer/availableServiceProvider',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.BookingAssignmentController.listAvailableSP(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Round settings for booking floating',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'customer'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            serviceID: Joi.string().min(24).max(24).required(),
            pickupLongitude: Joi.number().min(-180).max(180).precision(6).required(),
            pickupLatitude: Joi.number().min(-90).max(90).precision(6).required(),
            radius: Joi.number().description('distance range to float booking'),
            limit: Joi.number().description('Limit number of records'),
            skip: Joi.number().description('Skip number of records'),
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
  server.dependency(['auth', 'booking', 'core-controller', 'core-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'bookingAssignment',
};
