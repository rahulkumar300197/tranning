

const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment');

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
      path: '/booking/createBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
        };
        const data = await controllers.BookingController.createBooking(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Create Booking Request',
        auth: {
          strategy: 'JwtAuth',
          // scope: 'customer',
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            serviceID: Joi.string().min(24).max(24).required().description('service ID to which booking belongs'),
            deliveryName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
            deliveryEmail: Joi.string().email().required(),
            deliveryMobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
            deliveryCompanyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
            deliveryCity: Joi.string().trim().min(3).max(50).required(),
            deliveryState: Joi.string().trim().min(3).max(50).required(),
            deliveryZipcode: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).max(20).required(),
            deliveryCompanyAddress: Joi.string().trim().min(2).required(),
            deliveryLongitude: Joi.number().min(-180).max(180).precision(6).required(),
            deliveryLatitude: Joi.number().min(-90).max(90).precision(6).required(),

            pickupLongitude: Joi.number().min(-180).max(180).precision(6).required(),
            pickupLatitude: Joi.number().min(-90).max(90).precision(6).required(),
            deliveryDateTimeFrom: Joi.string().trim().min(2).optional(),
            deliveryDateTimeTo: Joi.string().trim().min(2).optional(),
            pickupName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
            pickupEmail: Joi.string().email().required(),
            pickupMobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
            pickupCompanyName: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
            pickupCity: Joi.string().trim().min(3).max(50).required(),
            pickupState: Joi.string().trim().min(3).max(50).required(),
            pickupZipcode: Joi.string().regex(/^[a-zA-Z0-9 ]+$/).max(20).required(),
            pickupCompanyAddress: Joi.string().trim().min(2).required(),

            pickupDateTimeFrom: Joi.string().trim().min(2).required(),
            pickupDateTimeTo: Joi.string().trim().min(2).optional(),

            saveDeliveryAddress: Joi.boolean().default(false).required(),
            savePickupAddress: Joi.boolean().default(false).required(),

            serviceProvider: Joi.string().min(24).max(24)
              .description('User ID of service provider, use endpoint /customer/availableServiceProvider for list of available serviceProvider'),
          },
          failAction: universalFunctions.failActionFunction,
        },
        pre: [
          {
            assign: 'validatePickupTime',
            method(request, reply) {
              const currentTime = moment();
              let timeToComapre = null;
              timeToComapre = moment(currentTime).add(10, 'minutes');
              // eslint-disable-next-line no-underscore-dangle
              timeToComapre = moment(timeToComapre._d);
              const lang = request.headers['content-language'];
              if (moment(request.payload.pickupDateTimeFrom).isBefore(timeToComapre)) { // TODO Standardize moment date format
                return reply(Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'PICKUP_TIME_PASSED' })));
              }
              reply(true);
            },
          },
          {
            assign: 'checkBookingFeasibility',
            async method(request, reply) {
              const payloadData = request.payload;
              const headers = request.headers;
              const data = await controllers.BookingController.checkBookingFeasibility(headers, payloadData);
              return reply(data);
            },
          },
        ],
        plugins: {
          'hapi-swagger': {
            payloadType: 'form',
            responseMessages: appConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    },
    {
      method: 'GET',
      path: '/booking/getPastBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.scope,
        };
        const data = await controllers.BookingController.getPastBooking(headers, queryData, userData);
        return reply(data);
      },
      config: {
        description: 'Get Past Booking For User',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['customer', 'serviceProvider', 'driver'],
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            limit: Joi.number().integer().optional(),
            skip: Joi.number().integer().optional(),
            dateFrom: Joi.date().optional(),
            dateTo: Joi.date().optional(),
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
    {
      method: 'GET',
      path: '/booking/getOngoingBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const userData = {
          userId: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.scope,
        };

        const data = await controllers.BookingController.getOngoingBooking(headers, queryData, userData);
        return reply(data);
      },
      config: {
        description: 'Get Ongoing Booking For User',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['customer', 'serviceProvider', 'driver'],
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            limit: Joi.number().integer().optional(),
            skip: Joi.number().integer().optional(),
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
    {
      method: 'GET',
      path: '/booking/getAllAvailabeBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.BookingController.getAllAvailableBooking(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Get All Availabe Booking For serviceProvider and Driver',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['serviceProvider', 'driver'],
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            limit: Joi.number().integer().optional(),
            skip: Joi.number().integer().optional(),
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
    {
      method: 'GET',
      path: '/booking/getBookingDetails',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.BookingController.getBookingDetails(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Get All Deatils of Particular Booking For serviceProvider and Driver',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['serviceProvider', 'driver', 'customer'],
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            id: Joi.string().required(),
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
    {
      method: 'PUT',
      path: '/booking/cancelBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.scope,
        };
        const data = await controllers.BookingController.cancelBooking(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Cancel Booking',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['serviceProvider', 'driver', 'customer'],
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            bookingID: Joi.string().required(),
            reasonForRejection: Joi.string().optional(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        pre: [{
          assign: 'updateBookingStatus',
          async method(request, reply) {
            const headers = request.headers;
            const payloadData = request.payload;
            const userData = {
              _id: request.auth.credentials.UserSession.user._id,
              // driver:request.auth.credentials.UserSession.user.driverID,
              // serviceProvider: request.auth.credentials.UserSession.user.serviceProviderID,
            };
            const preCheckData = await controllers.BookingController.bookingUpdatePreChecks(headers, payloadData, userData);
            return reply(preCheckData);
          },
        }],
        plugins: {
          'hapi-swagger': {
            responseMessages: appConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    },
    {
      method: 'POST',
      path: '/booking/makeBidByDriver',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.scope,
        };

        const data = await controllers.BookingController.makeAnOffer(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Cancel Booking',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['driver'],
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            bookingID: Joi.string().required().description('enter booking ID for which Bid is to be made'),
            bidValue: Joi.number().required(),
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
    {
      method: 'GET',
      path: '/booking/getAllBids',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
        };
        const data = await controllers.BookingController.getAllBids(headers, queryData, userData);
        return reply(data);
      },
      config: {
        description: 'Get All Bid Request',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['customer'],
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            bookingID: Joi.string().required().description('Booking id for the bids'),
            limit: Joi.number().integer().optional(),
            skip: Joi.number().integer().optional(),
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
    {
      method: 'PUT',
      path: '/booking/selectBidByCustomer',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.UserSession.user.role,
        };

        const data = await controllers.BookingController.selectBid(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Select Bid',
        auth: {
          strategy: 'JwtAuth',
          // scope: ['customer'],
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            bidID: Joi.string().required().description('Mongo Id of Bid Model'),
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
    {
      method: 'GET',
      path: '/admin/getPastBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.scope,
        };
        const data = await controllers.BookingController.getPastBooking(headers, queryData, userData);
        return reply(data);
      },
      config: {
        description: 'Get Past Booking',
        auth: {
          strategy: 'JwtAuth',
          // scope: 'admin',
        },
        tags: ['api', 'admin'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            limit: Joi.number().integer().optional().description('limit data in response'),
            skip: Joi.number().integer().optional().description('skip data from response'),
            dateFrom: Joi.date().optional(),
            dateTo: Joi.date().optional(),
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
    {
      method: 'GET',
      path: '/admin/getOngoingBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const userData = {
          userId: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.scope,
        };

        const data = await controllers.BookingController.getOngoingBooking(headers, queryData, userData);
        return reply(data);
      },
      config: {
        description: 'Get Ongoing Booking',
        auth: {
          strategy: 'JwtAuth',
          // scope: 'admin',
        },
        tags: ['api', 'admin'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            limit: Joi.number().integer().optional().description('limit data in response'),
            skip: Joi.number().integer().optional().description('skip data from response'),
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
    {
      method: 'GET',
      path: '/admin/getAllAvailabeBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.BookingController.getAllAvailableBooking(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Get All Availabe Booking',
        auth: {
          strategy: 'JwtAuth',
          // scope: 'admin',
        },
        tags: ['api', 'admin'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            limit: Joi.number().integer().optional().description('limit data in response'),
            skip: Joi.number().integer().optional().description('skip data from response'),
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
    {
      method: 'GET',
      path: '/admin/getBookingDetails',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.BookingController.getBookingDetails(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Get All Deatils of a Particular Booking',
        auth: {
          strategy: 'JwtAuth',
          // scope: 'admin',
        },
        tags: ['api', 'admin'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            id: Joi.string().required().description('booking id').min(24).max(24),
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
    {
      method: 'PUT',
      path: '/admin/cancelBooking',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.scope,
        };
        const data = await controllers.BookingController.cancelBooking(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Cancel Booking',
        auth: {
          strategy: 'JwtAuth',
          // scope: 'admin',
        },
        tags: ['api', 'admin'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            bookingID: Joi.string().required().min(24).max(24),
          },
          failAction: universalFunctions.failActionFunction,
        },
        pre: [{
          assign: 'updateBookingStatus',
          async method(request, reply) {
            const headers = request.headers;
            const payloadData = request.payload;
            const userData = {
              _id: request.auth.credentials.UserSession.user._id,
              role: request.auth.credentials.scope,
            };
            const lang = headers['content-language'];
            if (userData.role !== configs.UserConfiguration.get('/roles', { role: 'admin' })) {
              return reply(Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NOT_ADMIN' })));
            }
            const preCheckData = await controllers.BookingController.bookingUpdatePreChecks(headers, payloadData, userData);
            return reply(preCheckData);
          },
        }],
        plugins: {
          'hapi-swagger': {
            responseMessages: appConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    },
    {
      method: 'PUT',
      path: '/driver/updateBookingStatus',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.BookingController.updateBookingStatus(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'Driver review for shipper',
        auth: {
          strategy: 'JwtAuth',
          // scope: 'driver',
        },
        tags: ['api', 'driver'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            bookingID: Joi.string().required().description('booking id to be accepted'),
            bookingCurrentStatus: Joi.string().required().valid([bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'ENROUTE_TO_PICKUP' }),
              bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'PICKED_UP' }),
              bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'ENROUTE_TO_DELIVERY' }),
              bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'COMPLETED' })]),
          },
          failAction: universalFunctions.failActionFunction,
        },
        pre: [{
          assign: 'updateBookingStatus',
          async method(request, reply) {
            const headers = request.headers;
            const payloadData = request.payload;
            const userData = {
              _id: request.auth.credentials.UserSession.user._id,
              driverID: request.auth.credentials.UserSession.user.driverID,
            };
            const preCheckData = await controllers.BookingController.bookingUpdatePreChecks(headers, payloadData, userData);
            return reply(preCheckData);
          },
        }],
        plugins: {
          'hapi-swagger': {
            payloadType: 'form',
            responseMessages: appConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    },
    {
      method: 'PUT',
      path: '/booking/bookingAcceptReject',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
          name: request.auth.credentials.UserSession.user.name + request.auth.credentials.UserSession.user.lastName,
          role: request.auth.credentials.scope,
        };
        const data = await controllers.BookingController.bookingAcceptReject(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Accept-Reject Booking',
        auth: {
          strategy: 'JwtAuth',
          // scope: 'serviceProvider',
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            bookingID: Joi.string().required().min(24).max(24),
            bookingCurrentStatus: Joi.string().required().valid([bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'ACCEPTED' }),
              bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'REJECTED' })]),

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
    {
      method: 'GET',
      path: '/customer/bookingAddresses',
      async handler(request, reply) {
        const headers = request.headers;
        const userData = request.auth.credentials.UserSession.user;
        const queryData = request.query;
        const data = await controllers.BookingController.listAddress(headers, queryData, userData);
        return reply(data);
      },
      config: {
        description: 'Sends Reset Password Token To User',
        tags: ['api', 'customer'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          query: {
            addressType: Joi.string().required().valid([
              configs.AppConfiguration.get('/address', { type: 'DELIVERY' }),
              configs.AppConfiguration.get('/address', { type: 'PICKUP' }),
            ]),
            limit: Joi.number().integer().optional().description('limit data in response'),
            skip: Joi.number().integer().optional().description('limit data from response'),
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
    },
    {
      method: 'PUT',
      path: '/booking/assignBookingManually',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = {
          userID: request.auth.credentials.UserSession.user._id,
          role: request.auth.credentials.scope,
        };
        const data = await controllers.BookingController.assignBookingManually(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Send booking notification manually to sp/driver',
        auth: {
          strategy: 'JwtAuth',
        },
        tags: ['api', 'booking'],
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            userID: Joi.string().length(24).required().description('User id of service provider'),
            role: Joi.string().required().valid([
              configs.UserConfiguration.get('/roles', { role: 'driver' }),
              configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
            ]),
            bookingID: Joi.string().length(24).required().description('Booking ID'),
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
  name: 'booking',
};
