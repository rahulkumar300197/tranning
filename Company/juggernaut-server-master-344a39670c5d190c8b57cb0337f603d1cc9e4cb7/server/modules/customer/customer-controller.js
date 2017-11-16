const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;


  /**
   * @function <b>createCustomer</b><br> Method to Register Customer
   * @param {Object} customerData   Object containing Customer details
   */
  async function createCustomer(headers, payloadData, ipAddress) {
    try {
      const controllers = server.plugins['core-controller'];
      const lang = headers['content-language'];
      payloadData.addressType = configs.AppConfiguration.get('/address', { type: 'SELF' });
      const userRole = configs.UserConfiguration.get('/roles', { role: 'customer' });
      const promise = Promise.all([
        services.MongoService.createData('Customer', payloadData),
        services.MongoService.createData('Address', payloadData),
      ]);
      const userData = await promise;
      payloadData.role = userRole;
      payloadData.customerID = userData[0]._id;
      payloadData.customerAddressID = userData[1]._id;
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
        eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'NEW_CUSTOMER_REGISTER' }),
      };
      process.emit('sendNotificationToAdmin', dataToEmit);
      cleanResult.customer = userData[0];
      cleanResult.address = userData[1];

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
       * @function <b>updateCustomer</b><br> Method to Register Customer
       * @param {Object} userData   Object containing userid,email,defaultaddr,customerid
       * @param {Object} payloadData   Object containing user details
       */
  async function updateCustomer(headers, payloadData, userData) {
    try {
      const userCriteria = {
        _id: userData.userID,
      };
      const options = {
        new: true,
      };
      const user = await services.MongoService.updateData('User', userCriteria, payloadData, options);
      const customerCriteria = {
        _id: user.customerID,
      };
      const addressCriteria = {
        _id: user.customerAddressID,
      };
      const promise = Promise.all([
        services.MongoService.updateData('Customer', customerCriteria, payloadData, options),
        services.MongoService.updateData('Address', addressCriteria, payloadData, options),
      ]);
      const data = await promise;
      const cleanResult = JSON.parse(JSON.stringify(user));
      delete cleanResult.password;
      cleanResult.customer = data[0];
      cleanResult.address = data[1];
      return universalFunctions.sendSuccess(headers, cleanResult);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
     * @function <b>getdriver</b><br> method to search driver nearer address
     * @param {object} userinfo     object containing userid
     * @param {Object} queryData   Object containing location details
     */
  async function getDriver(headers, payloadData) {
    const radius = configs.AppConfiguration.get('/SEARCH_RADIUS', { USER: 'driver' });
    // userinfo contain customer infomation , queryData hold GeoSptial document that is used for search.
    try {
      const geoquearydata = {
        currentDriverLocation: {
          $geoWithin: {
            $center: [
              [payloadData.locationDetails.longitude, payloadData.locationDetails.latitude], radius],
          },
        },
      };
      let projections = {
        _id: 1,
      };
      const options = {
        lean: true,
      };
      const drivers = await services.MongoService.getDataAsync('Driver', geoquearydata, projections, options);
      projections = {
        _id: 1,
      };
      const userCriteria = {
        driverID: {
          $in: drivers,
        },
      };
      const data = await services.UserService.getUserDetails(userCriteria, projections, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  return {
    controllerName: 'CustomerController',
    createCustomer,
    updateCustomer,
    getDriver,
  };
};
