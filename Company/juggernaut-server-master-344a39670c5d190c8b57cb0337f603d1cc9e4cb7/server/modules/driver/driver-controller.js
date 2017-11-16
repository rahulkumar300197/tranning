const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
     * @function <b>createDriver</b><br> Method to register Driver
     * @param {Object} payloadData   Object Containing driver details
     * @param {Function} callback   callback Function
     */
  async function createDriver(headers, payloadData, ipAddress) {
    try {
      const controllers = server.plugins['core-controller'];
      const lang = headers['content-language'];
      payloadData.currentDriverLocation = {
        type: 'Point',
        coordinates: [payloadData.longitude, payloadData.latitude],
      };
      const userRole = configs.UserConfiguration.get('/roles', { role: 'driver' });
      payloadData.addressType = configs.AppConfiguration.get('/address', { type: 'SELF' });
      const promise = Promise.all([
        services.MongoService.createData('Driver', payloadData),
        services.MongoService.createData('Address', payloadData),
      ]);
      const userData = await promise;
      payloadData.role = userRole;
      payloadData.driverID = userData[0]._id;
      payloadData.driverAddressID = userData[1]._id;
      payloadData.password = universalFunctions.hashPasswordUsingBcrypt(payloadData.password);
      payloadData.utcoffset = headers.utcoffset;
      payloadData.mobile = payloadData.mobile;
      payloadData.countryCode = payloadData.countryCode;
      payloadData.contacts = [{
        mobile: payloadData.mobile,
        isPrimary: true,
        countryCode: payloadData.countryCode,
      }];
      const user = await services.MongoService.createData('User', payloadData);
      if (!payloadData.isAdminVerified) {
        controllers.ReferralController.addUserReferral(headers, user._id, userRole, payloadData);
      }
      const sessionData = {
        user: user._id,
        deviceType: payloadData.deviceType,
        deviceToken: payloadData.deviceToken || null,
        remoteIP: ipAddress,
      };
      const token = await services.UserService.sessionManager(payloadData.deviceType, sessionData, user, userRole);
      const userContact = {
        mobile: payloadData.mobile,
        countryCode: payloadData.countryCode,
      };
      await controllers.UserController.sendVerificationNotification(user, userContact, lang);

      const cleanResult = JSON.parse(JSON.stringify(user));
      cleanResult.token = token;
      delete cleanResult.password;
      const idToSend = configs.UserConfiguration.get('/roles', { role: 'admin' });
      const dataToEmit = {
        id: idToSend,
        eventID: cleanResult._id,
        eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'NEW_DRIVER_REGISTER' }),
      };
      process.emit('sendNotificationToAdmin', dataToEmit);
      cleanResult.driver = userData[0];
      cleanResult.address = userData[1];
      if (payloadData.createdBy) {
        const criteria = {
          _id: payloadData.createdBy,
        };
        const dataToUpdate = {
          $inc: {
            totalCreatedUsers: 1,
          },
        };
        const options = {
          new: true,
        };
        services.MongoService.updateData('User', criteria, dataToUpdate, options);
      }

      if (payloadData.deviceType === configs.UserConfiguration.get('/deviceTypes', { type: 'web' })) {
        const permissions = await controllers.AclController.getRoleWisePermission(userRole);
        cleanResult.permissions = permissions;
      }

      return universalFunctions.sendSuccess(headers, cleanResult);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
      * @function <b>updateDriver</b><br> Driver Update profile
      * @param {Object} userData   Object Containing user details
      * @param {object} payloadData object containing name,lastname,mobile,countrycode
      * @param {Function} callback   callback Function
      */

  async function updateDriver(headers, payloadData, userData) {
    try {
      const userCriteria = {
        _id: userData.userID,
      };
      const options = {
        new: true,
      };
      const user = await services.MongoService.updateData('User', userCriteria, payloadData, options);
      const driverCriteria = {
        _id: user.driverID,
      };
      const addressCriteria = {
        _id: user.driverAddressID,
      };
      const promise = Promise.all([
        services.MongoService.updateData('Driver', driverCriteria, payloadData, options),
        services.MongoService.updateData('Address', addressCriteria, payloadData, options),
      ]);
      const data = await promise;
      const cleanResult = JSON.parse(JSON.stringify(user));
      delete cleanResult.password;
      cleanResult.driver = data[0];
      cleanResult.address = data[1];
      return universalFunctions.sendSuccess(headers, cleanResult);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
     * @function <b>createVehicle</b><br> create or update vehicle details
     * @param {Object} payloadData   Object Containing vehicle details
     */
  async function addVehicle(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: userData.userID,
        role: {
          $in: ['driver'],
        },
      };
      const driverData = await services.MongoService.getFirstMatch('User', criteria, { _id: 1 }, {});
      if (driverData) {
        const dataToSave = payloadData;
        const newCriteria = {
          driver: userData.userID,
          vehicleNumber: payloadData.vehicleNumber,
        };
        const options = {
          upsert: true,
          lean: true,
          new: true,
        };
        dataToSave.driver = driverData._id;
        const data = await services.MongoService.updateData('Vehicle', newCriteria, dataToSave, options);
        delete data._id;
        return universalFunctions.sendSuccess(headers, data);
      }

      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
   * @function <b>addVehicleTypeAndCompany</b><br> add vehicle type and company
   * @param {Object} payloadData   Object Containing vehicle details
   */
  async function addVehicleTypeAndCompany(headers, payloadData) {
    try {
      const criteria = {
        vehicleType: payloadData.vehicleType,
        vehicleCompany: payloadData.vehicleCompany,
      };
      const options = {
        upsert: true,
        lean: true,
        new: true,
      };
      const dataToSave = criteria;
      dataToSave.isDeleted = false;
      const data = await services.MongoService.updateData('VehicleDetail', criteria, dataToSave, options);
      delete data._id;
      delete data.__v;
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>addVehicleTypeAndCompany</b><br> fetch vehicle type and company
   * @param {Object} queryData   Object Containing pagination and delete flag
   */
  async function listVehicleTypeAndCompany(headers, queryData) {
    try {
      const criteria = {};
      if (queryData.isDeleted) {
        criteria.isDeleted = true;
      } else if (queryData.isDeleted === false) {
        criteria.isDeleted = false;
      }
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          createdAt: -1,
        },
      };
      const projection = {
        vehicleType: 1,
        vehicleCompany: 1,
        isDeleted: 1,
        _id: 0,
      };
      const data = await services.MongoService.getDataAsync('VehicleDetail', criteria, projection, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>deleteVehicleTypeAndCompany</b><br> add vehicle type and company
   * @param {Object} payloadData   Object Containing vehicle details
   */
  async function deleteVehicleTypeAndCompany(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        vehicleType: payloadData.vehicleType,
        vehicleCompany: payloadData.vehicleCompany,
        isDeleted: false,
      };
      const options = {
        new: true,
      };
      const dataToUpdate = {
        isDeleted: true,
      };
      const data = await services.MongoService.updateData('VehicleDetail', criteria, dataToUpdate, options);
      if (!data) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'VEHICLE_TYPE_NOT_FOUND' }));
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
     * @function <b>getVehicle</b><br> get vehicle details
     * @param {Object} userData object containing user details
     */
  async function getVehicle(headers, userData, queryData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: userData.userID,
        role: {
          $in: ['driver'],
        },
      };
      const driverData = await services.MongoService.getFirstMatch('User', criteria, { _id: 1 }, {});
      if (driverData) {
        const newCriteria = {
          driver: userData.userID,
          isDeleted: queryData.isDeleted,
        };
        const options = {
          limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
          skip: queryData.skip || 0,
          sort: {
            createdAt: -1,
          },
        };
        const data = await services.MongoService.getDataAsync('Vehicle', newCriteria, { _id: 0 }, options);
        return universalFunctions.sendSuccess(headers, data);
      }

      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
     * @function <b>deleteVehicle</b><br> delete vehicle details
     * @param {Object} payloadData   Object Containing vehicle details
     */
  async function deleteVehicle(headers, userData, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: userData.userID,
        role: {
          $in: ['driver'],
        },
      };
      const driverData = await services.MongoService.getFirstMatch('User', criteria, { _id: 1 }, {});
      if (driverData) {
        const dataToSave = {
          isDeleted: true,
        };
        const newCriteria = {
          driver: userData.userID,
          vehicleNumber: payloadData.vehicleNumber,
          isDeleted: false,
        };
        const options = {
          lean: true,
          new: true,
        };
        dataToSave.driver = driverData._id;
        const data = await services.MongoService.updateData('Vehicle', newCriteria, dataToSave, options);
        if (data) {
          delete data._id;
          return universalFunctions.sendSuccess(headers, data);
        }

        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'VEHICLE_NOT_FOUND' }));
      } else {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function validateServiceProvider(headers, serviceProvider, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: userData.userID,
        createdBy: serviceProvider._id,
      };
      const driverData = await services.MongoService.getFirstMatch('User', criteria, { _id: 1 }, {});
      if (driverData) {
        return true;
      }
      throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_CREATED' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'DriverController',
    createDriver,
    updateDriver,
    addVehicle,
    getVehicle,
    deleteVehicle,
    validateServiceProvider,
    addVehicleTypeAndCompany,
    listVehicleTypeAndCompany,
    deleteVehicleTypeAndCompany,
  };
};
