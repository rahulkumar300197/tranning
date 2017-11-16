const Joi = require('joi');
const socketIO = require('socket.io');

global.socketStatus = false;
const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  const userService = services.UserService;

  const socket = socketIO.listen(server.listener);

  /** ************************************************
    * Authentication Middleware for socket Connections
    ************************************************* */
  // eslint-disable-next-line no-shadow
  socket.use(async (socket, next) => {
    const tempToken = socket.handshake.query.token || null;
    if (tempToken) {
      try {
        const decodedData = await userService.decodeSessionToken(tempToken);
        if (decodedData.userID && decodedData.role !== configs.UserConfiguration.get('/roles', { role: 'admin' })) {
          socket.join(decodedData.userID);
          socket.emit('messageFromServer', {
            message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ADDED_SOCKET_CONNECTION' }),
            performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'INFO_EVENT' }),
          });
        } else if (decodedData.userID && decodedData.role === configs.UserConfiguration.get('/roles', { role: 'admin' })) {
          socket.join(decodedData.role);
          socket.emit('messageFromServer', {
            message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ADDED_SOCKET_CONNECTION' }),
            performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'INFO_EVENT' }),
          });
        } else {
          socket.emit('messageFromServer', {
            message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'INVALID_TOKEN' }),
            performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ERROR_EVENT' }),
          });
        }
      } catch (error) {
        winstonLogger.error(error);
        socket.emit('messageFromServer', {
          message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'INVALID_TOKEN' }),
          performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ERROR_EVENT' }),
        });
      }
      next();
    } else {
      socket.emit('messageFromServer', {
        message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ADDED_SOCKET_CONNECTION' }),
        performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'INFO_EVENT' }),
      });
    }
  });

  // FIRE SOCKET TO PARTICULAR ROOM [ALL ACTIVE SESSIONS OF A USER]
  process.on('sendNotificationToAdmin', async (socketData) => {
    const socketToSend = socketData.id;
    socketData.isAdminNotification = true;
    const createNotification = await controllers.NotificationController.createNotification(socketData);
    const unreadNotificationCount = await controllers.NotificationController.getUnreadNotificationCount(socketData);
    socket.to(socketToSend).emit('notification', { unreadNotificationCount, notification: createNotification });
  });

  process.on('sendLocationToAdmin', async (socketData) => {
    const socketToSend = socketData.id;
    socket.to(socketToSend).emit('location', socketData);
  });

  process.on('sendNotificationToServiceProvider', async (socketData) => {
    const socketToSend = socketData.id;
    socketData.notificationUserID = socketData.id;
    const createNotificationForServiceProvider = await controllers.NotificationController.createNotification(socketData);
    const unreadNotificationCount = await controllers.NotificationController.getUnreadNotificationCount(socketData);
    socket.to(socketToSend).emit('notification', { unreadNotificationCount, notification: createNotificationForServiceProvider });
  });

  process.on('sendNotificationToDriver', async (socketData) => {
    const socketToSend = socketData.id;
    socketData.notificationUserID = socketData.id;
    const createNotificationForDriver = await controllers.NotificationController.createNotification(socketData);
    const unreadNotificationCount = await controllers.NotificationController.getUnreadNotificationCount(socketData);
    socket.to(socketToSend).emit('notification', { unreadNotificationCount, notification: createNotificationForDriver });
  });

  process.on('sendNotificationToCustomer', async (socketData) => {
    const socketToSend = socketData.id;
    socketData.notificationUserID = socketData.id;
    const createNotificationForCustomer = await controllers.NotificationController.createNotification(socketData);
    const unreadNotificationCount = await controllers.NotificationController.getUnreadNotificationCount(socketData);
    socket.to(socketToSend).emit('notification', { unreadNotificationCount, notification: createNotificationForCustomer });
  });

  // fire socket to customer and admin
  process.on('trackDriver', async (socketData) => {
    const socketToSend = socketData.id;
    socket.to(socketToSend).emit('driverLocation', socketData);
  });


  // FOR LISTENING CLIENT SIDE EVENTS
  // eslint-disable-next-line no-shadow
  socket.on('connection', (socket) => {
    // frontend will allow the person to join the room based on bookingid
    // send booking id to track to create room
    socket.on('room', (bookingID) => {
      socket.join(bookingID);
    });

    // fire socket to customer and admin
    socket.on('trackDriver', async (socketData) => {
      const socketToSend = socketData.id;
      socket.to(socketToSend).emit('driverLocation', socketData);
    });

    // get location
    socket.on('getLocation', async (socketData) => {
      try {
        const dataToSet = {};
        if (socketData.token && socketData.currentLocation) {
          const decodedData = await userService.decodeSessionToken(socketData.token);
          if (decodedData.userID && decodedData.role) {
            dataToSet.currentLocation = socketData.currentLocation;
            const headers = {
              'content-language': 'en',
            };
            await controllers.TrackingController.updateUserTracking(headers, dataToSet, decodedData);
          }
        }
      } catch (error) {
        winstonLogger.error(error);
        return socket.emit('messageFromServer', {
          message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'INVALID_TOKEN' }),
          performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ERROR_EVENT' }),
        });
      }
    });

    // get location from driver and update database
    socket.on('updateDriverLocation', async (socketData) => {
      try {
        const dataToSet = {};
        if (socketData.token) {
          const decodedData = await userService.decodeSessionToken(socketData.token);
          if (decodedData.userID && decodedData.role) {
            controllers.TrackingController.startBookingTracking(null, dataToSet);
          }
        }
      } catch (error) {
        winstonLogger.error(error);
        return socket.emit('messageFromServer', {
          message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'INVALID_TOKEN' }),
          performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ERROR_EVENT' }),
        });
      }
    });

    // READ NOTIFICATION THROUGH SOCKET
    socket.on('readNotificationByAdmin', async (socketData) => {
      try {
        if (socketData.token && socketData.notificationID) {
          const decodedData = await userService.decodeSessionToken(socketData.token);
          if (decodedData.userID && decodedData.role) {
            socketData.notificationID = [socketData.notificationID];
            await controllers.NotificationController.readNotification(null, socketData);
          }
          socketData.isAdminNotification = true;
          const unreadNotificationCount = await controllers.NotificationController.getUnreadNotificationCount(socketData);
          const socketToSend = decodedData.role;
          if (socketToSend) {
            socket.to(socketToSend).emit('notification', {
              message: 'Notification Successfully Read',
              eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'UNREAD_NOTIFICATION_COUNT' }),
              data: null,
              notificationID: socketData.notificationID[0],
              unreadNotificationCount,
            });
          }
        } else {
          socket.emit('messageFromServer', {
            message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'BAD_DATA' }),
            performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ERROR_EVENT' }),
          });
        }
      } catch (error) {
        winstonLogger.error(error);
        return socket.emit('messageFromServer', {
          message: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'INVALID_TOKEN' }),
          performAction: configs.AppConfiguration.get('/SOCKET', { MESSAGE: 'ERROR_EVENT' }),
        });
      }
    });
  });

  server.route({
    method: 'PUT',
    path: '/notification/clearNotification',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      if (!payloadData.isAdminNotification) {
        payloadData.notificationUserID = request.auth.credentials.UserSession.user._id;
      }
      const data = await controllers.NotificationController.clearNotification(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Clear Admin Notification',
      tags: ['api', 'notification'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          isAdminNotification: Joi.boolean().optional().description('True if notifications are for admin'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
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
    path: '/notification/readNotification',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      if (!payloadData.isAdminNotification) {
        payloadData.notificationUserID = request.auth.credentials.UserSession.user._id;
      }
      const data = await controllers.NotificationController.readNotification(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Read Admin Notification',
      tags: ['api', 'notification'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          notificationID: Joi.array().items(Joi.string().required()).description('Array of notification IDs'),
          markAllAsRead: Joi.boolean().required().default(false),
          isAdminNotification: Joi.boolean().optional().description('Required only if markAllAsRead is true'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
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
    path: '/notification/getAllNotification',
    async handler(request, reply) {
      const headers = request.headers;
      const queryData = request.query;
      if (!queryData.isAdminNotification) {
        queryData.notificationUserID = request.auth.credentials.UserSession.user._id;
      }
      const data = await controllers.NotificationController.getAllNotification(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'Get All Notification Of Admin',
      tags: ['api', 'notification'],
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        query: {
          isAdminNotification: Joi.boolean().optional().description('Required only if markAllAsRead is true'),
          limit: Joi.number().integer().optional(),
          skip: Joi.number().integer().optional(),
        },
        failAction: universalFunctions.failActionFunction,
      },
      auth: {
        strategy: 'JwtAuth',
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
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.applyRoutes);

  next();
};

exports.register.attributes = {
  name: 'notification',
};
