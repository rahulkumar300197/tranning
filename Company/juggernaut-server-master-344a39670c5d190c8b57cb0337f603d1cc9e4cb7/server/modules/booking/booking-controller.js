const Boom = require('boom');
const moment = require('moment');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const bookingConfiguration = configs.BookingConfiguration;
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  const controllers = server.plugins['core-controller'];

  async function createBooking(headers, payloadData, userData) {
    try {
      let serviceProvider;
      if (payloadData.serviceProvider) {
        serviceProvider = payloadData.serviceProvider;
        delete payloadData.serviceProvider;
      }
      if (payloadData.saveDeliveryAddress) {
        const deliveryAddress = {
          customerID: userData.userID,
          companyAddress: payloadData.deliveryCompanyAddress,
          latitude: payloadData.deliveryLocationLat,
          longitude: payloadData.deliveryLocationLong,
          city: payloadData.deliveryCity,
          state: payloadData.deliveryState,
          zipCode: payloadData.deliveryZipcode,
          addressType: configs.AppConfiguration.get('/address', { type: 'DELIVERY' }),
        };
        services.MongoService.createData('Address', deliveryAddress);
      }
      if (payloadData.savePickupAddress) {
        const pickupAddress = {
          customerID: userData.userID,
          companyAddress: payloadData.pickupCompanyAddress,
          latitude: payloadData.pickupLocationLat,
          longitude: payloadData.pickupLocationLong,
          city: payloadData.pickupCity,
          state: payloadData.pickupState,
          zipCode: payloadData.pickupZipcode,
          addressType: configs.AppConfiguration.get('/address', { type: 'PICKUP' }),
        };
        services.MongoService.createData('Address', pickupAddress);
      }

      payloadData.customer = userData.userID;

      // custom ID generation of the booking
      let name = '';
      if (payloadData.pickupCompanyName.split(' ')[1]) {
        name += `${payloadData.pickupCompanyName.split(' ')[0].substring(0, 1) + payloadData.pickupCompanyName.split(' ')[1].substring(0, 1)} `;
      } else {
        name += `${(payloadData.pickupCompanyName.substring(0, 2)).toUpperCase()} `;
      }

      payloadData.pickupCoordinates = {
        type: 'Point',
        coordinates: [payloadData.pickupLongitude, payloadData.pickupLatitude],
      };

      payloadData.deliveryCoordinates = {
        type: 'Point',
        coordinates: [payloadData.deliveryLongitude, payloadData.deliveryLatitude],
      };

      name += `${moment().format('DD MM YY')} `;
      name += Math.floor(Math.random() * 999);
      payloadData.customID = name;


      const data = await services.MongoService.createData('Booking', payloadData);
      // no need to wait as it is cron based task and will consume time
      const bookingType = configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'NEW_BOOKING_REQUEST' });
      if (serviceProvider) {
        // send notification to admin for booking floating
        const dataToEmit = {
          id: configs.UserConfiguration.get('/roles', { role: 'admin' }),
          eventID: data._id,
          eventType: bookingType,
        };

        process.emit('sendNotificationToAdmin', dataToEmit);
        controllers.BookingAssignmentController.notifySP(serviceProvider, data._id, bookingType);
      } else {
        controllers.BookingAssignmentController.floatBookingForSP(headers, data, bookingType);
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getPastBooking(headers, queryData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {};
      criteria.isDeleted = false;
      if (userData.role === configs.UserConfiguration.get('/roles', { role: 'customer' })) {
        criteria.customer = userData.userID;
      } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
        criteria.driver = userData.userID;
      } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
        criteria.serviceProvider = userData.userID;
      }

      // Check for filters
      if (queryData.dateFrom && queryData.dateTo) {
        criteria.pickupDateTimeFrom = {
          $gte: moment(queryData.dateFrom).startOf('day'),
          $lte: moment(queryData.dateTo).endOf('day'),
        };
      } else if (queryData.dateTo) {
        criteria.pickupDateTimeFrom = { $lte: moment(queryData.dateTo).endOf('day') };
      } else if (queryData.dateFrom) {
        criteria.pickupDateTimeFrom = { $gte: moment(queryData.dateFrom).startOf('day') };
      }

      criteria.currentStatus = {
        $in: [
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_DRIVER',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_ADMIN',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'COMPLETED',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'EXPIRED',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_CUSTOMER',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_SERVICE_PROVIDER',
          }),

        ],
      };
      const dataCount = await services.MongoService.countData('Booking', criteria);
      let bookingData;
      if (dataCount) {
        const options = {
          limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
          skip: queryData.skip || 0,
          sort: {
            pickupDateTimeFrom: -1,
          },
          lean: true,
        };
        bookingData = await services.MongoService.getDataAsync('Booking', criteria, { __v: 0 }, options);
      }
      for (let i = 0; i < bookingData.length; i += 1) {
        bookingData[i].currentStatus = configs.MessageConfiguration.get('/lang', { locale: lang, message: bookingData[i].currentStatus });
      }
      return universalFunctions.sendSuccess(headers, { dataCount, bookingData });
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  async function getOngoingBooking(headers, queryData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {};
      criteria.isDeleted = false;

      if (userData.role === configs.UserConfiguration.get('/roles', {
        role: 'customer',
      })) {
        criteria.customer = userData.userID;
      } else if (userData.role === configs.UserConfiguration.get('/roles', {
        role: 'driver',
      })) {
        criteria.driver = userData.userID;
      } else if (userData.role === configs.UserConfiguration.get('/roles', {
        role: 'serviceProvider',
      })) {
        criteria.serviceProvider = userData.userID;
      }

      criteria.currentStatus = {
        $nin: [
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_DRIVER',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'COMPLETED',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'PENDING',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_ADMIN',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'EXPIRED',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_CUSTOMER',
          }),
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_SERVICE_PROVIDER',
          }),

        ],
      };

      const dataCount = await services.MongoService.countData('Booking', criteria);
      let bookingData;
      if (dataCount > 0) {
        const options = {
          limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
          skip: queryData.skip || 0,
          sort: {
            pickupDateTimeFrom: -1,
          },
          lean: true,
        };
        bookingData = await services.MongoService.getDataAsync('Booking', criteria, { __v: 0 }, options);
      }
      for (let i = 0; i < bookingData.length; i += 1) {
        bookingData[i].currentStatus = configs.MessageConfiguration.get('/lang', { locale: lang, message: bookingData[i].currentStatus });
      }
      return universalFunctions.sendSuccess(headers, { dataCount, bookingData });
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getAllAvailableBooking(headers, queryData) {
    try {
      const lang = headers['content-language'];
      const criteria = {};
      criteria.isDeleted = false;
      criteria.currentStatus = {
        $in: [
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'PENDING',
          }),
        ],
      };
      const dataCount = await services.MongoService.countData('Booking', criteria);
      let bookingData;
      if (dataCount > 0) {
        const options = {
          limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
          skip: queryData.skip || 0,
          sort: {
            pickupDateTimeFrom: -1,
          },
          lean: true,
        };
        bookingData = await services.MongoService.getDataAsync('Booking', criteria, { __v: 0 }, options);
      }
      for (let i = 0; i < bookingData.length; i += 1) {
        bookingData[i].currentStatus = configs.MessageConfiguration.get('/lang', { locale: lang, message: bookingData[i].currentStatus });
      }
      return universalFunctions.sendSuccess(headers, { dataCount, bookingData });
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getBookingDetails(headers, queryData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: queryData.id,
        isDeleted: false,
      };
      const data = await services.MongoService.getDataAsync('Booking', criteria, {}, { lean: true });
      if (data.length > 0) {
        for (let i = 0; i < bookingData.length; i += 1) {
          bookingData[i].currentStatus = configs.MessageConfiguration.get('/lang', { locale: lang, message: bookingData[i].currentStatus });
        }
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function cancelBooking(headers, payloadData, userData) {
    try {
      let criteriaForBooking = {};
      let dataToSetBooking = {};
      if (userData.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
        criteriaForBooking = {
          driver: userData.userID,
          _id: payloadData.bookingID,
        };
        dataToSetBooking = {
          currentStatus: bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_DRIVER',
          }),
          cancelReasonByDriver: payloadData.reasonForRejection,
        };
      } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
        criteriaForBooking = {
          serviceProvider: userData.userID,
          _id: payloadData.bookingID,
        };
        dataToSetBooking = {
          currentStatus: bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_SERVICE_PROVIDER',
          }),
          cancelReasonByServiceProvider: payloadData.reasonForRejection,
        };
      } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'customer' })) {
        criteriaForBooking = {
          customer: userData.userID,
          _id: payloadData.bookingID,
        };
        dataToSetBooking = {
          currentStatus: bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_CUSTOMER',
          }),
          cancelReasonByCustomer: payloadData.reasonForRejection,
        };
      } else {
        criteriaForBooking = {
          _id: payloadData.bookingID,
        };
        dataToSetBooking = {
          currentStatus: bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'CANCELLED_BY_ADMIN',
          }),
        };
      }

      const data = await services.MongoService.updateData('Booking', criteriaForBooking, dataToSetBooking, { new: true });
      if (data) {
        const idToSend = configs.UserConfiguration.get('/roles', {
          role: 'admin',
        });
        const dataToEmit = {
          id: idToSend,
          eventID: data._id,
          eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'BOOKING_CANCELLED' }),
        };

        process.emit('sendNotificationToAdmin', dataToEmit);
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function makeAnOffer(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {};
      criteria.isDeleted = false;
      criteria._id = payloadData.bookingID;
      criteria.currentStatus = {
        $in: [
          bookingConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'PENDING',
          }),
        ],
      };
      const projection = {};

      const data = await services.MongoService.getDataAsync('Booking', criteria, projection, {});
      if (!data.length > 0) {
        throw Boom.notFound(configs.MessageConfiguration.get('/BOOKING_NOT_FOUND'));
      } else {
        const bidCriteria = {};
        bidCriteria.isDeleted = false;
        bidCriteria.bookingID = payloadData.bookingID;
        bidCriteria.biddingStatus = 'ON';
        if (userData.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
          bidCriteria.driverID = userData.userID;
        } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
          bidCriteria.serviceProviderID = userData.userID;
        }

        const bidData = await services.MongoService.getDataAsync('Bid', bidCriteria, projection, {});
        if (bidData.length > 0) {
          throw Boom.conflict(configs.MessageConfiguration.get('/ALREADY_EXIST'));
        }

        const dataToSet = {
          bookingID: payloadData.bookingID,
          customerID: data[0].customer,
          biddingAmount: payloadData.bidValue,
          biddingStatus: 'ON',
        };

        if (userData.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
          dataToSet.driverID = userData.userID;
        } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
          dataToSet.serviceProviderID = userData.userID;
        }
        const bid = await services.MongoService.createData('Bid', dataToSet);
        if (bid) {
          return universalFunctions.sendSuccess(lang, bid);
        }
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getAllBids(headers, queryData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        bookingID: queryData.bookingID,
        customerID: userData.userID,
        isDeleted: false,
      };
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          createdAt: -1,
        },
      };
      const data = await services.MongoService.getDataAsync('Bid', criteria, {}, options);
      if (data) {
        return universalFunctions.sendSuccess(lang, data);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BID_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function selectBid(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.bidID,
        customerID: userData.userID,
        isDeleted: false,
      };
      const dataToSet = {
        biddingStatus: 'ACCEPTED',
      };
      const options = {
        new: true,
      };
      const biddingData = await services.MongoService.updateData('Bid', criteria, dataToSet, options);
      if (!biddingData) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BID_NOT_FOUND' }));
      }
      const bookingCriteria = {
        _id: biddingData.bookingID,
        currentStatus: 'PENDING',
      };
      const dataToUpdate = {
        currentStatus: 'ACCEPTED',
        price: biddingData.biddingAmount,
      };
      if (biddingData.driverID) {
        dataToUpdate.driver = biddingData.driverID;
      } else if (biddingData.serviceProviderID) {
        dataToUpdate.serviceProvider = biddingData.serviceProviderID;
      }
      const bookingData = await services.MongoService.updateData('Booking', bookingCriteria, dataToUpdate, options);
      return universalFunctions.sendSuccess(headers, bookingData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
  * @function <b>updatebookingStatus</b> UPDATE STATUS OF ONGOING booking
  * @param {object} userData USER CREDENTIALS
  * @param {object} payloadData STATUS DATA FROM PAYLOAD
  * @param {function} callback
  */
  async function updateBookingStatus(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = { _id: payloadData.bookingID };
      const status = { currentStatus: payloadData.bookingCurrentStatus };
      const options = { new: true };
      if (payloadData.bookingCurrentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'COMPLETED' })) {
        status.bookingCompletionDateTime = moment();
      }

      const bookingData = await services.MongoService.updateData('Booking', criteria, status, options);
      if (!bookingData) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_NOT_FOUND' }));
      }
      const idToSend = bookingData.customer;
      const dataToEmit = {
        id: idToSend,
        eventID: bookingData._id,
        eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'BOOKING_STATUS_CHANGE' }),
      };
      process.emit('sendNotificationToAdmin', dataToEmit);
      bookingData.currentStatus = configs.MessageConfiguration.get('/lang', { locale: lang, message: bookingData.currentStatus });
      return universalFunctions.sendSuccess(headers, bookingData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function bookingUpdatePreChecks(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.bookingID,
      };
      const projection = {
        currentStatus: 1,
        driver: 1,
        serviceProvider: 1,
        customer: 1,
      };
      const options = {
        lean: true,
      };
      const bookingData = await services.MongoService.getFirstMatch('Booking', criteria, projection, options);
      if (bookingData) {
        const driver = (bookingData.driver && bookingData.driver.toString()) || null;
        const serviceProvider = (bookingData.serviceProvider && bookingData.serviceProvider.toString()) || null;
        const customer = (bookingData.customer && bookingData.customer.toString()) || null;
        if (bookingData.currentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'COMPLETED' })) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_ALREADY_COMPLETED' }));
        } else if (bookingData.currentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'CANCELLED_BY_SERVICE_PROVIDER' })) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_CANCELED_BY_SERVICEPROVIDER' }));
        } else if (bookingData.currentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'CANCELLED_BY_CUSTOMER' })) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_CANCELED_BY_CUSTOMER' }));
        } else if (bookingData.currentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'CANCELLED_BY_DRIVER' })) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_CANCELED_BY_DRIVER' }));
        } else if (bookingData.currentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'CANCELLED_BY_ADMIN' })) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_CANCELED_BY_ADMIN' }));
          //eslint-disable-next-line
        } else if (userData.role !== configs.UserConfiguration.get('/roles', { role: 'admin' }) && !((driver === userData._id.toString()) || (serviceProvider === userData._id.toString()) || (customer === userData._id.toString()))) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_NOT_ASSIGNED' }));
        } else if (bookingData.currentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'ENROUTE_TO_DELIVERY' })) {
          if (payloadData.bookingCurrentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'PICKED_UP' })
            || payloadData.bookingCurrentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'ENROUTE_TO_PICKUP' })) {
            throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_STATUS_PREVIOUS' }));
          }
          return true;
        } else if (bookingData.currentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'PICKED_UP' })) {
          if (payloadData.bookingCurrentStatus === bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'ENROUTE_TO_PICKUP' })) {
            throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_STATUS_PREVIOUS' }));
          }
          return true;
        }
      } else {
        return true;
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function bookingAcceptReject(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.bookingID,
      };
      const projection = {
        currentStatus: 1,
        driver: 1,
        serviceProvider: 1,
      };
      const options = {
        new: true,
      };

      let bookingData = await services.MongoService.getFirstMatch('Booking', criteria, projection, options);
      if (bookingData.currentStatus === configs.BookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'ACCEPTED' })) {
        if (userData.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }) && bookingData.serviceProvider) {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_ALREADY_ACCEPTED_BY_SP' }));
        } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'driver' }) && bookingData.driver) {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_ALREADY_ACCEPTED_BY_DRIVER' }));
        }
      } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_CANNOT_ACCEPTED_BEFORE_SP' }));
      }

      const status = {
        currentStatus: payloadData.bookingCurrentStatus,
      };
      if (userData.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
        status.serviceProvider = userData.userID;
        status.serviceProviderName = userData.name;
      } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
        status.driver = userData.userID;
        status.driverName = userData.name;
      }

      bookingData = await services.MongoService.updateData('Booking', criteria, status, options);
      if (!bookingData) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_NOT_FOUND' }));
      }
      let bookingStatus;
      if (bookingData.currentStatus === configs.BookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'REJECTED' })) {
        bookingStatus = configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'BOOKING_REJECTED' });
      } else if (bookingData.driver) {
        bookingStatus = configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'BOOKING_ACCEPTED_BY_DRIVER' });
      } else {
        const serviceProviderID = bookingData.serviceProvider;
        controllers.BookingAssignmentController.floatBookingForDriver(headers, bookingData, userData, serviceProviderID);
        bookingStatus = configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'BOOKING_ACCEPTED' });
      }
      const idToSend = bookingData.customer;
      const dataToEmit = {
        id: idToSend,
        eventID: bookingData._id,
        eventType: bookingStatus,
      };

      if (userData.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
        process.emit('sendNotificationToCustomer', dataToEmit);

        dataToEmit.id = configs.UserConfiguration.get('/roles', { role: 'admin' });
        process.emit('sendNotificationToAdmin', dataToEmit);
      } else if (userData.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
        dataToEmit.id = bookingData.serviceProvider;
        process.emit('sendNotificationToServiceProvider', dataToEmit);
      }

      return universalFunctions.sendSuccess(headers, bookingData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function checkBookingFeasibility(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.serviceID,
      };
      const projection = {
        _id: 1,
      };
      const options = {
        lean: true,
        limit: 1,
      };
      const data = await services.MongoService.getDataAsync('Service', criteria, projection, options);
      if (!data) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INVALID_SERVICE_ID' }));
      } else {
        return true;
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function assignBookingManually(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      let criteria = {
        role: payloadData.role,
        _id: payloadData.userID,
      };
      let projection = {
        name: 1,
        lastName: 1,
        _id: 1,
      };
      const options = {
        lean: true,
      };

      const user = await services.MongoService.getFirstMatch('User', criteria, projection, options);
      if (!user) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }

      criteria = {
        _id: payloadData.bookingID,
      };
      projection = {
        serviceProvider: 1,
      };
      const booking = await services.MongoService.getFirstMatch('Booking', criteria, projection, options);

      if (!booking) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_NOT_FOUND' }));
      }

      if (userData.role !== configs.UserConfiguration.get('/roles', { role: 'admin' })) {
        if (booking.serviceProvider.toString() !== userData.userID.toString()) {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NOT_BELONG_BOOKING' }));
        }
      }


      const bookingID = booking._id;
      const bookingType = configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'NEW_BOOKING_REQUEST' });
      const userID = user._id;

      if (payloadData.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
        controllers.BookingAssignmentController.notifySP(userID, bookingID, bookingType);
      } else if (payloadData.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
        controllers.BookingAssignmentController.notifyDriver(userID, bookingID, bookingType);
      }
      const response = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'BOOKING_NOTIFICATION_SENT' });
      return universalFunctions.sendSuccess(headers, response);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function listAddress(headers, queryData, userData) {
    try {
      const criteria = {
        addressType: queryData.addressType,
        customerID: userData._id,
      };
      const projection = {};
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        } };
      const address = await services.MongoService.getDataAsync('Address', criteria, projection, options);
      return universalFunctions.sendSuccess(headers, address);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  return {
    controllerName: 'BookingController',
    createBooking,
    checkBookingFeasibility,
    getPastBooking,
    getOngoingBooking,
    getAllAvailableBooking,
    getBookingDetails,
    cancelBooking,
    makeAnOffer,
    getAllBids,
    selectBid,
    updateBookingStatus,
    bookingUpdatePreChecks,
    bookingAcceptReject,
    listAddress,
    assignBookingManually,
  };
};
