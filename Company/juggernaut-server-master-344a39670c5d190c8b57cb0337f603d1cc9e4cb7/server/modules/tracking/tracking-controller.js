const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
   * @function <b>updateDriverLocation</b><br>
   * @param {Object} headers
   * @param {Object} payloadData
   */
  async function updateDriverLocation(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      if (!userData) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      // admin is shown loc of user when tracking is on

      if (payloadData.isTrackingOn) {
        const controllers = server.plugins['core-controller'];
        controllers.TrackingController.updateUserTracking(headers, payloadData, userData);
      }
      const criteria = {
        _id: userData.driverID,
      };
      const projection = {
        currentDriverLocation: 1,
      };
      const options = {
        new: true,
        lean: true,
      };
      const driverData = await services.MongoService.getFirstMatch('Driver', criteria, projection, options);
      if (!driverData) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      const setQuery = {
        $set: {
          currentDriverLocation: {
            type: payloadData.currentLocation.type,
            coordinates: [payloadData.currentLocation.longitude, payloadData.currentLocation.latitude],
          },
          locationUpdatedAt: new Date().toISOString(),
        },
      };
      await services.MongoService.updateData('Driver', criteria, setQuery, options);
      const driverOldLoction = {
        longitude: driverData.currentDriverLocation.coordinates[0],
        latitude: driverData.currentDriverLocation.coordinates[1],
      };
      const driverNewLocation = {
        latitude: payloadData.currentLocation.latitude,
        longitude: payloadData.currentLocation.longitude,
      };

      const distanceTravelled = universalFunctions.getDistanceBetweenPoints(driverOldLoction, driverNewLocation); // In Kilometer
      // eslint-disable-next-line max-len
      const angleDeg = universalFunctions.getBearing(driverOldLoction.latitude, driverOldLoction.longitude, driverNewLocation.latitude, driverNewLocation.longitude);
      const data = {
        distanceTravelled,
        atAngle: angleDeg,
      };
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
     * @function <b>getUserTracking</b><br>
     * @param {Object} headers
     * @param {Object} payloadData
     */

  async function getUserTracking(headers, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        user: userData.userID,
      };
      const data = await services.MongoService.getFirstMatch('Tracking', criteria, {}, { lean: true });
      if (data && data !== null) {
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>updateUserTracking</b><br>get current location of user with socket
   * @param {Object} headers
   * @param {Object} payloadData
   */
  async function updateUserTracking(headers, payloadData, userData) {
    // const lang = headers['content-language'
    const idToSend = configs.UserConfiguration.get('/roles', {
      role: 'admin',
    });
    const dataToEmit = {
      id: idToSend,
      eventType: 'send location data',
      currentLocation: {
        coordinates: [payloadData.currentLocation.longitude, payloadData.currentLocation.latitude],
      },
    };
    process.emit('sendLocationToAdmin', dataToEmit);
    try {
      const criteria = {
        user: userData._id,
        // role: userData.role,
      };
      const setQuery = {
        $push: {
          currentLocation: {
            type: payloadData.currentLocation.type,
            coordinates: [payloadData.currentLocation.longitude, payloadData.currentLocation.latitude],
          },
          locationUpdatedAt: new Date().toISOString(),
        },
      };
      const options = {
        upsert: true,
        new: true,
        lean: true,
      };
      const data = await services.MongoService.updateData('Tracking', criteria, setQuery, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  /**
     * @function <b>getBookingDetails</b><br>
     * @param {Object} headers
     * @param {Object} payloadData
     */

  async function getRouteforBooking(headers, queryData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        bookingID: queryData.bookingID,
      };
      const data = await services.MongoService.getFirstMatch('trackBooking', criteria, { s3URL: 1 }, { lean: true });
      if (data && data !== null) {
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
     * @function <b>startBookingTracking</b><br>
     * @param {Object} headers
     * @param {Object} payloadData
     */
  async function startBookingTracking(headers, payloadData) {
    const dataToEmit = {
      id: payloadData.bookingID,
      eventID: payloadData.bookingID,
      eventType: configs.AppConfiguration.get('/NOTIFICATION', {
        NOTIFICATION: 'TRACK_DRIVER',
      }),
      driverRoute: payloadData.routes,
    };
    process.emit('trackDriver', dataToEmit);
    try {
      const lang = headers['content-language'];
      const criteria = {
        bookingID: payloadData.bookingID,
      };
      const projections = {
        _id: 1,
        trackingFinished: 1,
      };
      const options = {
        lean: true,
        new: true,
      };
      let data;
      const getBookingData = await services.MongoService.getFirstMatch('trackBooking', criteria, projections, options);
      if (getBookingData) {
        if (getBookingData.trackingFinished) {
          throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'TRACKING_FINISHED' }));
        }
        const dataToSave = {
          $push: {
            route: {
              latitude: payloadData.routes.latitude,
              longitude: payloadData.routes.longitude,
              accuracy: payloadData.routes.accuracy,
            },
          },
        };
        data = await services.MongoService.updateData('trackBooking', criteria, dataToSave, options);
      } else {
        const createData = {
          bookingID: payloadData.bookingID,
          customerID: payloadData.customerID,
          driverID: payloadData.driverID,
          driverName: payloadData.driverName,
          route: {
            latitude: payloadData.routes.latitude,
            longitude: payloadData.routes.longitude,
            accuracy: payloadData.routes.accuracy,
          },
        };
        data = await services.MongoService.createData('trackBooking', createData);
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>uploadTrackHistorytoS3</b><br>
   * @param {Object} headers
   * @param {Object} payloadData
   */
  async function uploadTrackHistorytoS3(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        bookingID: payloadData.bookingID,
        trackingFinished: false,
      };
      const dataToCheck = await services.MongoService.getFirstMatch('trackBooking', criteria, {}, { lean: true });
      if (dataToCheck === null) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'TRACKING_ALREADY_UPLOADED' }));
      }
      const trackFileURL = await services.S3Bucket.uploadFile(payloadData.trackHistoryFile);
      const dataToSave = {
        trackingFinished: true,
        s3URL: trackFileURL,
        route: [],
      };
      const options = {
        new: true,
      };
      const data = await services.MongoService.updateData('trackBooking', criteria, dataToSave, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'TrackingController',
    getUserTracking,
    updateDriverLocation,
    updateUserTracking,
    getRouteforBooking,
    startBookingTracking,
    uploadTrackHistorytoS3,
  };
};
