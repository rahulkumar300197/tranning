const Boom = require('boom');
const moment = require('moment');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;


  async function assignDriverToServiceProvider(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.driverID,
        isBlocked: false,
        isDeleted: false,
      };
      const dataToUpdate = {
        assignedTo: payloadData.serviceProviderID,
        assignedBy: payloadData.assignedBy,
      };
      const options = {
        new: true,
        lean: true,
      };
      const data = await services.MongoService.updateData('User', criteria, dataToUpdate, options);
      if (!data) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      const idToSend = payloadData.serviceProviderID;
      const dataToEmit = {
        id: idToSend,
        eventID: data._id,
        eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'ASSIGN_DRIVER' }),
      };
      process.emit('sendNotificationToServiceProvider', dataToEmit);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>blockFunctionality</b> block or unblock user by admin
   * @param {object} user userID to be blocked or unblocked by admin
   * @param {function} callback
   */
  async function blockFunctionality(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const userCriteria = {
        _id: payloadData.userID,
        isBlocked: payloadData.isBlocked,
      };
      const projection = {
        isBlocked: 1,
      };
      const options = {
        new: true,
        lean: true,
      };
      const userData = await services.MongoService.getFirstMatch('User', userCriteria, projection, options);
      if (userData) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NOT_UPDATED' }));
      }
      const criteria = {
        _id: payloadData.userID,
      };
      const dataToSave = {
        isBlocked: payloadData.isBlocked,
      };
      await services.MongoService.updateData('User', criteria, dataToSave, options);
      const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UPDATED' });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
  * @function <b>verifyUser</b> verification of user by admin
  * @param {object} user userID to be verified by admin
  * @param {function} callback
  */
  async function verifyUser(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData._id,
      };
      const dataToSave = {
        isAdminVerified: true,
      };
      const options = {
        new: true,
      };
      const verify = await services.MongoService.updateData('User', criteria, dataToSave, options);
      if (verify.isAdminVerified) {
        const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UPDATED' });
        return universalFunctions.sendSuccess(headers, data);
      }
      const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NOT_UPDATED' });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
    * @function <b>deleteFunctionality</b> delete user by admin
    * @param {object} user userId to be deleted by admin
    * @param {function} callback
    */

  async function deleteUser(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.userID,
      };
      const dataToUpdate = {
        isDeleted: true,
      };
      const options = {
        new: true,
      };
      await services.MongoService.updateData('User', criteria, dataToUpdate, options);
      const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UPDATED' });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getUserData(headers, queryData) {
    try {
      const criteria = {
        _id: queryData.userID,
      };
      const data = await services.UserService.getUserDetails(criteria, {}, { limit: 1 });
      if (data.length < 1) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      const cleanResult = JSON.parse(JSON.stringify(data[0]));
      delete cleanResult.password;
      return universalFunctions.sendSuccess(headers, cleanResult);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function setDefaultSettings(headers, payloadData) {
    try {
      const criteria = {};
      const options = {
        new: true,
        upsert: true,
      };
      const data = await services.MongoService.updateData('AdminSetting', criteria, payloadData, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  async function listDefaultSettings(headers) {
    try {
      const criteria = {};
      const options = {
        new: true,
      };
      const projection = {
        _id: 0,
        __v: 0,
      };
      const data = await services.MongoService.getDataAsync('AdminSetting', criteria, projection, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>getAllUsers</b> GET LIST OF ALL USERS
   * @param {object} payloadData QUERY DATA FOR FILTERING USERS
   * @param {function} callback
   */
  async function getAllUsers(headers, queryData, userData) {
    try {
      const criteria = {};
      if (queryData.isDeleted !== 'all') {
        criteria.isDeleted = queryData.isDeleted;
      }
      if (queryData.isBlocked !== 'all') {
        criteria.isBlocked = queryData.isBlocked;
      }
      if (queryData.isAdminVerified !== 'all') {
        criteria.isAdminVerified = queryData.isAdminVerified;
      }

      if (queryData.role !== 'all') {
        criteria.role = queryData.role;
      }
      if (queryData.createdBySelf) {
        criteria.createdBy = userData._id;
      }
      if (queryData.searchUser) {
        criteria.$or = [
          {
            name: {
              $regex: queryData.searchUser,
              $options: 'i',
            },
          },
          {
            userName: {
              $regex: queryData.searchUser,
              $options: 'i',
            },
          },
          {
            email: {
              $regex: queryData.searchUser,
              $options: 'i',
            },
          },
        ];
      }
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
      };
      const projection = {
        password: 0,
        passwordResetToken: 0,
        emailVerificationToken: 0,
      };
      const count = await services.MongoService.countData('User', criteria);
      const usersDetails = await services.UserService.getUserDetails(criteria, projection, options);
      const data = {
        count,
        users: usersDetails,
      };
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getDashboardCount(headers) {
    try {
      const totalCustomerCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'customer' }),
        isDeleted: false,
      };
      const totalDriverCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'driver' }),
        isDeleted: false,
      };
      const totalServiceProviderCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
        isDeleted: false,
      };
      const totalBookingCriteria = {
        isDeleted: false,
      };

      const totalRevenueCriteria = [{
        $match: {
          currentStatus: configs.AppConfiguration.get('/BOOKING_STATUS', { STATUS: 'COMPLETED' }),
          isDeleted: false,
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

      const todayCustomerCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'customer' }),
        isDeleted: false,
        createdAt: {
          $gte: new Date(moment().startOf('day')),
          $lte: new Date(moment().endOf('day')),
        },
      };

      const todayDriverCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'driver' }),
        isDeleted: false,
        createdAt: {
          $gte: new Date(moment().startOf('day')),
          $lte: new Date(moment().endOf('day')),
        },
      };

      const todayServiceProviderCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
        isDeleted: false,
        createdAt: {
          $gte: new Date(moment().startOf('day')),
          $lte: new Date(moment().endOf('day')),
        },
      };

      const todayBookingCriteria = {
        role: configs.UserConfiguration.get('/roles', { role: 'customer' }),
        isDeleted: false,
        createdAt: {
          $gte: new Date(moment().startOf('day')),
          $lte: new Date(moment().endOf('day')),
        },
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


      const monthlyCustomerCriteria = [{
        $match: {
          role: configs.UserConfiguration.get('/roles', { role: 'customer' }),
          isDeleted: false,
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

      const monthlyDriverCriteria = [{
        $match: {
          role: configs.UserConfiguration.get('/roles', { role: 'driver' }),
          isDeleted: false,
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

      const monthlyServiceProviderCriteria = [{
        $match: {
          role: configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
          isDeleted: false,
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
        services.MongoService.countData('User', totalCustomerCriteria),
        services.MongoService.countData('User', totalDriverCriteria),
        services.MongoService.countData('User', totalServiceProviderCriteria),
        services.MongoService.countData('Booking', totalBookingCriteria),
        services.MongoService.aggregateData('Booking', totalRevenueCriteria), // revenue total
        services.MongoService.countData('User', todayCustomerCriteria),
        services.MongoService.countData('User', todayDriverCriteria),
        services.MongoService.countData('User', todayServiceProviderCriteria),
        services.MongoService.countData('Booking', todayBookingCriteria),
        services.MongoService.countData('Booking', todayRevenueCriteria),
        services.MongoService.aggregateData('User', monthlyCustomerCriteria),
        services.MongoService.aggregateData('User', monthlyDriverCriteria),
        services.MongoService.aggregateData('User', monthlyServiceProviderCriteria),
        services.MongoService.aggregateData('Booking', monthlyBookingCriteria),
        services.MongoService.aggregateData('Booking', monthlyRevenueCriteria),
      ]);
      const dashboardData = await promise;
      const totalData = {
        totalCustomerCount: dashboardData[0],
        totalDriverCount: dashboardData[1],
        totalServiceProviderCount: dashboardData[2],
        totalBookingCount: dashboardData[3],
        totalRevenue: dashboardData[4],

        todaysCustomerCount: dashboardData[5],
        todaysDriverCount: dashboardData[6],
        todaysServiceProvidersCount: dashboardData[7],
        todaysBookingRequestsCount: dashboardData[8],
        todaysRevenue: dashboardData[9],

        monthlyCustomerCount: dashboardData[10],
        monthlydriverCount: dashboardData[11],
        monthlyServiceProviderCount: dashboardData[12],
        monthlyBookingCount: dashboardData[13],
        monthlyRevenue: dashboardData[14],
      };
      return universalFunctions.sendSuccess(headers, totalData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }
  return {
    controllerName: 'AdminController',
    blockFunctionality,
    assignDriverToServiceProvider,
    verifyUser,
    deleteUser,
    getUserData,
    setDefaultSettings,
    listDefaultSettings,
    getAllUsers,
    getDashboardCount,
  };
};
