const Boom = require('boom');
const _ = require('underscore');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const controllers = server.plugins['core-controller'];
  const universalFunctions = utilityFunctions.universalFunction;


  /** *****************************************************************************************
  *                                                                                          *
  *                                                                                          *
  *                   Booking Assignment Algorithms --- START                                *
  *                                                                                          *
  *                                                                                          *
  ****************************************************************************************** */


  /**
   * addBookingFloatSetting
   * @param {JSON} headers 
   * @param {JSON} payloadData request body params 
   */
  async function addBookingFloatSetting(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const criteria = {
        forWhom: payloadData.forWhom,
      };
      if (payloadData.forWhom === configs.AppConfiguration.get('/roles', { role: 'driver' })) {
        if (payloadData.serviceProviderID) {
          criteria.serviceProviderID = payloadData.serviceProviderID;
        } else {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SP_ID_MISSING' }));
        }
      }
      const count = await services.MongoService.countData('bookingFloatSetting', criteria);
      if (count > 0) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_ALGO_EXIST' }));
      } else {
        const data = await services.MongoService.createData('bookingFloatSetting', payloadData);
        return universalFunctions.sendSuccess(headers, data);
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * updateBookingFloatSetting
   * @param {JSON} headers 
   * @param {JSON} payloadData request body params 
   */
  async function updateBookingFloatSetting(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const criteria = {
        forWhom: payloadData.forWhom,
      };
      if (payloadData.forWhom === configs.AppConfiguration.get('/roles', { role: 'driver' })) {
        if (payloadData.serviceProviderID) {
          criteria.serviceProviderID = payloadData.serviceProviderID;
        } else {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SP_ID_MISSING' }));
        }
      }
      const count = await services.MongoService.countData('bookingFloatSetting', criteria);
      if (count < 1) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_ALGO_NOT_FOUND' }));
      } else {
        const options = {
          new: true,
        };
        const data = await services.MongoService.updateData('bookingFloatSetting', criteria, payloadData, options);
        return universalFunctions.sendSuccess(headers, data);
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * listBookingFloatSetting
   * @param {JSON} headers 
   * @param {JSON} queryData request body params 
   */
  async function listBookingFloatSetting(headers, queryData) {
    try {
      const criteria = {};

      if (queryData.forWhom) {
        criteria.forWhom = queryData.forWhom;
      }

      if (queryData.serviceProviderID) {
        criteria.serviceProviderID = queryData.serviceProviderID;
      }

      if (queryData.typeOfAlgo) {
        criteria.typeOfAlgo = queryData.typeOfAlgo;
      }

      const projection = {
        _id: 0,
        __V: 0,
      };

      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
      };

      const data = await services.MongoService.getDataAsync('bookingFloatSetting', criteria, projection, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /** *****************************************************************************************
   *                                                                                         *
   *                                                                                         *
   *                   Booking Assignment Algorithms --- END                                 *
   *                                                                                         *
   *                                                                                         *
   ****************************************************************************************** */


  /** *****************************************************************************************
   *                                                                                         *
   *                                                                                         *
   *                   Booking Assignment for Driver --- START                               *
   *                                                                                         *
   *                                                                                         *
   ****************************************************************************************** */


  /**
   * pendingBookingForDriver
   * @param {JSON} bookingData 
   */
  async function pendingBookingForDriver(bookingData) {
    try {
      const criteria = {
        _id: bookingData._id,
      };

      const projection = {
        driver: 1,
      };

      const option = {
        lean: true,
        sort: {
          _id: 1,
        },
      };
      const bookingStatus = await services.MongoService.getFirstMatch('Booking', criteria, projection, option);
      if (bookingStatus.driver) {
        return false;
      }
      return true;
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  /**
   * notifyDriver
   * @param {ObjectId} driverID driver unique userID
   * @param {ObjectId} bookingID booking unique ID
   * @param {String} bookingType Booking notification type
   */
  async function notifyDriver(driverID, bookingID, bookingType) {
    const dataToEmit = {
      id: driverID,
      eventID: bookingID,
      eventType: bookingType,
    };
    process.emit('sendNotificationToDriver', dataToEmit);
  }

  /**
   * availableDriver
   * @param {JSON} headers content-language and authorization headers
   * @param {JSON} bookingData 
   * @param {Number} distanceRange distance upto which SP will be searched
   * @param {JSON} userData serviceProvider details
   */
  async function availableDriver(headers, bookingData, distanceRange, userData) {
    try {
      let criteria = {
        assignedTo: userData.userID,
      };

      let projection = {
        driverID: 1,
      };

      let options = {
        sort: {
          driverID: 1,
        },
      };

      const users = await services.MongoService.getDataAsync('User', criteria, projection, options);
      const driverID = _.pluck(users, 'driverID');

      criteria = {
        _id: {
          $in: driverID,
        },
        currentDriverLocation: {
          $near:
          {
            $geometry: {
              type: 'Point',
              coordinates: bookingData.pickupCoordinates.coordinates,
            },
            $maxDistance: distanceRange,
          },
        },
      };
      projection = {
        _id: 1,
      };

      options = {
        lean: true,
        sort: {
          _id: 1,
        },
      };
      const availableDrivers = await services.MongoService.getDataAsync('Driver', criteria, projection, options);
      const data = [];
      for (let index = 0; index < availableDrivers.length; index += 1) {
        if ((availableDrivers.length > 0) && (users[index].driverID.toString() === availableDrivers[index]._id.toString())) {
          data.push(users[index]._id);
        }
      }
      return data;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
   * broadcastBookingForDriver
   * @param {JSON} headers content-language and authorization headers
   * @param {JSON} bookingData 
   * @param {NUMBER} radius distance upto which SP will be searched
   * @param {STRING} bookingType Booking notification type
   * @param {ObjectId} serviceProvider userID of serviceProvider for driver dependent on him
   */
  async function broadcastBookingForDriver(headers, bookingData, radius, bookingType, userData) {
    try {
      const allAvailableDriver = await availableDriver(headers, bookingData, radius, userData);
      for (let index = 0; index < allAvailableDriver.length; index += 1) {
        notifyDriver(allAvailableDriver[index], bookingData._id, bookingType);
      }
    } catch (error) {
      winstonLogger.error(error);
    }
  }

  /**
   * floatBookingForDriver 
   * @param {*} headers content-language and authorization headers
   * @param {*} bookingData 
   * @param {*} serviceProviderID serviceProvider to whom driver belongs
   */

  async function floatBookingForDriver(headers, bookingData, userData, serviceProviderID) {
    try {
      const bookingID = bookingData._id;
      const bookingType = configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'NEW_BOOKING_REQUEST' });

      let criteria = {
        forWhom: configs.AppConfiguration.get('/roles', { role: 'driver' }),
        serviceProviderID,
      };
      const projection = {
        _id: 0,
        __V: 0,
      };

      const options = {
        lean: true,
      };

      const bookingFloatSetting = await services.MongoService.getFirstMatch('bookingFloatSetting', criteria, projection, options);
      criteria = {
        _id: bookingID,
      };

      if (bookingFloatSetting.typeOfAlgo === configs.BookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'BROADCAST' })) {
        const dataToEmit = {
          id: userData.userID,
          eventID: bookingID,
          eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'BOOKING_FORWARD_TO_DRIVER' }),
        };
        process.emit('sendNotificationToServiceProvider', dataToEmit);
        if (bookingFloatSetting.reAttempt === 0) {
          const radius = bookingFloatSetting.distanceRange;
          broadcastBookingForDriver(headers, bookingData, radius, bookingType, userData);
        } else {
          controllers.AgendaController.broadcastReAttemptForDriver(headers, bookingData, bookingFloatSetting, bookingType, userData);
        }
      } else if (bookingFloatSetting.typeOfAlgo === configs.BookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'ROUND_ROBIN' })) {
        const dataToEmit = {
          id: userData.userID,
          eventID: bookingID,
          eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'BOOKING_FORWARD_TO_DRIVER' }),
        };
        process.emit('sendNotificationToServiceProvider', dataToEmit);
        controllers.AgendaController.RRBookingFloatForDriver(headers, bookingData, bookingFloatSetting, bookingType, userData);
      }
      return true;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }
  /** *****************************************************************************************
   *                                                                                         *
   *                                                                                         *
   *                   Booking Assignment for Driver --- END                                 *
   *                                                                                         *
   *                                                                                         *
   ****************************************************************************************** */


  /** *****************************************************************************************
  *                                                                                          *
  *                                                                                          *
  *                   Booking Assignment for Service Provider --- START                      *
  *                                                                                          *
  *                                                                                          *
  ****************************************************************************************** */

  /**
   * pendingBookingForSP 
   * @param {JSON} bookingData 
   */
  async function pendingBookingForSP(bookingData) {
    try {
      const criteria = {
        _id: bookingData._id,
      };

      const projection = {
        serviceProvider: 1,
      };

      const option = {
        lean: true,
        sort: {
          _id: 1,
        },
      };
      const bookingStatus = await services.MongoService.getFirstMatch('Booking', criteria, projection, option);
      if (bookingStatus.serviceProvider) {
        return false;
      }
      return true;
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  /**
   * notifySP
   * @param {ObjectId} spID serviceProvider unique userID
   * @param {ObjectId} bookingID booking unique ID
   * @param {String} bookingType Booking notification type
   */
  async function notifySP(spID, bookingID, bookingType) {
    const dataToEmit = {
      id: spID,
      eventID: bookingID,
      eventType: bookingType,
    };
    process.emit('sendNotificationToServiceProvider', dataToEmit);
  }

  /**
   * availableSP search all the available sp based on location and service of booking
   * @param {*} headers content-language and authorization headers
   * @param {*} bookingData 
   * @param {*} distanceRange distance upto which SP will be searched 
   */
  async function availableSP(headers, bookingData, distanceRange) {
    try {
      let criteria = {
        _id: bookingData.serviceID,
        serviceProviders: {
          $elemMatch: {
            isApproved: true,
          },
        },
      };

      let projection = {
        serviceProviders: 1,
        _id: 0,
      };

      const options = {
        lean: true,
        sort: {
          _id: 1,
        },
      };

      const serviceProviders = await services.MongoService.getDataAsync('Service', criteria, projection, options);
      const userID = _.pluck(serviceProviders[0].serviceProviders, 'serviceProviderID');

      criteria = {
        _id: {
          $in: userID,
        },
      };

      projection = {
        serviceProviderID: 1,
      };
      const userOptions = {
        sort: {
          serviceProviderID: 1,
        },
      };
      const users = await services.MongoService.getDataAsync('User', criteria, projection, userOptions);
      const spID = _.pluck(users, 'serviceProviderID');

      criteria = {
        _id: {
          $in: spID,
        },
        currentSPLocation: {
          $near:
          {
            $geometry: {
              type: 'Point',
              coordinates: bookingData.pickupCoordinates.coordinates,
            },
            $maxDistance: distanceRange,
          },
        },
      };
      projection = {
        _id: 1,
      };
      const availableServiceProviders = await services.MongoService.getDataAsync('ServiceProvider', criteria, projection, options);
      const data = [];
      for (let index = 0; index < availableServiceProviders.length; index += 1) {
        if ((availableServiceProviders.length > 0)
          && (users[index].serviceProviderID.toString() === availableServiceProviders[index]._id.toString())) {
          data.push(users[index]._id);
        }
      }
      return data;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * 
   * @param {JSON} headers content-language and authorization headers
   * @param {JSON} bookingData 
   * @param {NUMBER} radius distance upto which SP will be searched
   * @param {STRING} bookingType Booking notification type
   */
  async function broadcastBookingForSP(headers, bookingData, radius, bookingType) {
    try {
      const allAvailableSP = await availableSP(headers, bookingData, radius);
      for (let index = 0; index < allAvailableSP.length; index += 1) {
        notifySP(allAvailableSP[index], bookingData._id, bookingType);
      }
    } catch (error) {
      winstonLogger.error(error);
    }
  }


  /**
   * floatBookingForSP send new booking notification to serviceProvider
   * @param {JSON} headers content-language and authorization headers
   * @param {JSON} bookingData 
   * @param {String} bookingType Booking notification type
   */

  async function floatBookingForSP(headers, bookingData, bookingType) {
    try {
      const criteria = {
        forWhom: configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
      };
      const projection = {
        _id: 0,
        __V: 0,
      };
      const options = {
        lean: true,
      };

      const bookingFloatSetting = await services.MongoService.getFirstMatch('bookingFloatSetting', criteria, projection, options);

      // send notification to admin for booking floating
      const dataToEmit = {
        id: configs.UserConfiguration.get('/roles', { role: 'admin' }),
        eventID: bookingData._id,
        eventType: bookingType,
      };

      process.emit('sendNotificationToAdmin', dataToEmit);
      if (bookingFloatSetting.typeOfAlgo === configs.BookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'BROADCAST' })) {
        if (bookingFloatSetting.reAttempt === 0) {
          const radius = bookingFloatSetting.distanceRange;
          broadcastBookingForSP(headers, bookingData, radius, bookingType);
        } else {
          controllers.AgendaController.broadcastReAttemptForSP(headers, bookingData, bookingFloatSetting, bookingType);
        }
      } else if (bookingFloatSetting.typeOfAlgo === configs.BookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'ROUND_ROBIN' })) {
        controllers.AgendaController.RRBookingFloatForSP(headers, bookingData, bookingFloatSetting, bookingType);
      }
      return true;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /** *****************************************************************************************
   *                                                                                         *
   *                                                                                         *
   *                   Booking Assignment for Service Provider --- END                       *
   *                                                                                         *
   *                                                                                         *
   ****************************************************************************************** */


  /**
   * listAvailableSP find available service provider for manual booking assignment by customer
   * @param {JSON} headers content-language and authorization headers
   * @param {JSON} queryData request params
   */
  async function listAvailableSP(headers, queryData) {
    try {
      let radius;
      if (queryData.radius) {
        radius = queryData.radius;
      } else {
        const criteria = {
          forWhom: configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
        };
        const projection = {
          _id: 0,
          __V: 0,
        };
        const options = {
          lean: true,
        };

        const bookingFloatSetting = await services.MongoService.getFirstMatch('bookingFloatSetting', criteria, projection, options);
        if (bookingFloatSetting.distanceRange) {
          radius = bookingFloatSetting.distanceRange;
        } else {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SEARCH_RADIUS_MISSING' }));
        }
      }
      const bookingData = {
        serviceID: queryData.serviceID,
        pickupCoordinates: {
          coordinates: [queryData.pickupLongitude, queryData.pickupLatitude],
        },
      };
      const availableServiceProviders = await availableSP(headers, bookingData, radius);
      const criteria = {
        _id: {
          $in: availableServiceProviders,
        },
      };
      const projection = {
        password: 0,
        emailVerificationToken: 0,
        emailVerificationTokenUpdatedAt: 0,
        __v: 0,
      };
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
      };
      const data = await services.UserService.getUserDetails(criteria, projection, options);

      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'BookingAssignmentController',

    // booking assignment algo setup functions
    addBookingFloatSetting,
    updateBookingFloatSetting,
    listBookingFloatSetting,

    // booking assignment to driver functions
    pendingBookingForDriver,
    notifyDriver,
    availableDriver,
    broadcastBookingForDriver,
    floatBookingForDriver,

    // booking assignment to service provider functions
    pendingBookingForSP,
    notifySP,
    availableSP,
    broadcastBookingForSP,
    floatBookingForSP,

    listAvailableSP,
  };
};
