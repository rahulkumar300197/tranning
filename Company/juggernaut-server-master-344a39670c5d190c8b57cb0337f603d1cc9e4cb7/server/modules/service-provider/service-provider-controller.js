const moment = require('moment');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  const services = server.plugins['core-services'];

  /**
   * @function <b>registerProvider</b><br> Method to Register ServiceProvider
   * @param {Object} serviceProviderData  Object Containing serviceProvider details
   * @param {Function} callback   callback Function
   */
  async function createServiceProvider(headers, payloadData, ipAddress) {
    try {
      const controllers = server.plugins['core-controller'];
      const lang = headers['content-language'];

      payloadData.currentSPLocation = {
        type: 'Point',
        coordinates: [payloadData.longitude, payloadData.latitude],
      };

      payloadData.addressType = configs.AppConfiguration.get('/address', { type: 'SELF' });
      const userRole = configs.UserConfiguration.get('/roles', { role: 'serviceProvider' });

      const promise = Promise.all([
        services.MongoService.createData('ServiceProvider', payloadData),
        services.MongoService.createData('Address', payloadData),
      ]);

      const userData = await promise;
      payloadData.role = userRole;
      payloadData.serviceProviderID = userData[0]._id;
      payloadData.serviceProviderAddressID = userData[1]._id;
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
        eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'NEW_SERVICE_PROVIDER_REGISTER' }),
      };
      process.emit('sendNotificationToAdmin', dataToEmit);
      cleanResult.serviceProvider = userData[0];
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
  * @function <b>updateServiceProvider</b><br> Method to update ServiceProvider profile
  * @param {Object} userData  Object Containing user details
  * @param {object} payloadData object containg service provider details
  * @param {Function} callback   callback Function
  */

  async function updateServiceProvider(headers, payloadData, userData) {
    try {
      const userCriteria = {
        _id: userData.userID,
      };
      const options = {
        new: true,
      };
      const user = await services.MongoService.updateData('User', userCriteria, payloadData, options);
      const serviceProviderCriteria = {
        _id: user.serviceProviderID,
      };
      const addressCriteria = {
        _id: user.serviceProviderAddressID,
      };
      const promise = Promise.all([
        services.MongoService.updateData('ServiceProvider', serviceProviderCriteria, payloadData, options),
        services.MongoService.updateData('Address', addressCriteria, payloadData, options),
      ]);
      const data = await promise;
      const cleanResult = JSON.parse(JSON.stringify(user));
      delete cleanResult.password;
      cleanResult.serviceProvider = data[0];
      cleanResult.address = data[1];
      return universalFunctions.sendSuccess(headers, cleanResult);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getDashboardCount(headers, userData) {
    try {
      const totalDriverCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'driver' }),
        isDeleted: false,
        createdBy: userData._id,
      };

      const totalBookingCriteria = {
        isDeleted: false,
        serviceProvider: userData._id,
      };

      const totalRevenueCriteria = [{
        $match: {
          currentStatus: configs.AppConfiguration.get('/BOOKING_STATUS', { STATUS: 'COMPLETED' }),
          isDeleted: false,
          serviceProvider: userData._id,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$price',
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      }];

      const todayDriverCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'driver' }),
        isDeleted: false,
        createdAt: {
          $gte: new Date(moment().startOf('day')),
          $lte: new Date(moment().endOf('day')),
        },
        createdBy: userData._id,
      };

      const todayBookingCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'customer' }),
        isDeleted: false,
        createdAt: {
          $gte: new Date(moment().startOf('day')),
          $lte: new Date(moment().endOf('day')),
        },
        serviceProvider: userData._id,
      };

      const todayRevenueCriteria = [{
        $match: {
          currentStatus: configs.AppConfiguration.get('/BOOKING_STATUS', {
            STATUS: 'COMPLETED',
          }),
          isDeleted: false,
          bookingCompletionDateTime: {
            $gte: new Date(moment().startOf('day')),
            $lte: new Date(moment().endOf('day')),
          },
          serviceProvider: userData._id,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: '$price',
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      }];

      const monthlyDriverCriteria = [{
        $match: {
          role: configs.UserConfiguration.get('/roles', { role: 'driver' }),
          isDeleted: false,
          createdBy: userData._id,
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          total: 1,
        },
      }];

      const monthlyBookingCriteria = [{
        $match: {
          isDeleted: false,
          serviceProvider: userData._id,
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          total: 1,
        },
      }];

      const monthlyRevenueCriteria = [{
        $match: {
          currentStatus: configs.AppConfiguration.get('/BOOKING_STATUS', { STATUS: 'COMPLETED' }),
          isDeleted: false,
          serviceProvider: userData._id,
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$price' },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          total: 1,
        },
      }];

      const promise = Promise.all([
        services.MongoService.countData('User', totalDriverCriteria),
        services.MongoService.countData('Booking', totalBookingCriteria),
        services.MongoService.aggregateData('Booking', totalRevenueCriteria), // revenue total
        services.MongoService.countData('User', todayDriverCriteria),
        services.MongoService.countData('Booking', todayBookingCriteria),
        services.MongoService.countData('Booking', todayRevenueCriteria),
        services.MongoService.aggregateData('User', monthlyDriverCriteria),
        services.MongoService.aggregateData('Booking', monthlyBookingCriteria),
        services.MongoService.aggregateData('Booking', monthlyRevenueCriteria),
      ]);
      const dashboardData = await promise;
      const totalData = {
        totalDriverCount: dashboardData[0],
        totalBookingCount: dashboardData[1],
        totalRevenue: dashboardData[2],

        todaysDriverCount: dashboardData[3],
        todaysBookingRequestsCount: dashboardData[4],
        todaysRevenue: dashboardData[5],

        monthlydriverCount: dashboardData[6],
        monthlyBookingCount: dashboardData[7],
        monthlyRevenue: dashboardData[8],
      };
      return universalFunctions.sendSuccess(headers, totalData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'SPController',
    createServiceProvider,
    updateServiceProvider,
    getDashboardCount,
  };
};
