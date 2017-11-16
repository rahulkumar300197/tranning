const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
     * @function <b>createNotification</b> CREATE NOTIFICATION OF USER
     * @param {object} userData USER CREDENTIALS
     * @param {function} callback
     */

  async function createNotification(notificationData) {
    try {
      const dataToSet = notificationData;
      return await services.MongoService.createData('Notification', dataToSet);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
  ** @function <b>clearNotification</b> CLEAR ALL USER NOTIFICATION
  ** @param {object} userData USER CREDENTIALS
  ** @param {function} callback
  * */

  async function clearNotification(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = { isDeleted: false };
      if (payloadData.isAdminNotification) {
        criteria.isAdminNotification = true;
      } else if (payloadData.notificationUserID) {
        criteria.notificationUserID = payloadData.notificationUserID;
      }
      const dataToSet = { isDeleted: true };
      const options = { multi: true, new: true };
      const data = await services.MongoService.updateMultiple('Notification', criteria, dataToSet, options);
      const customResponse = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RECORDS_MODIFIED_COUNT' }) + data.nModified;
      return universalFunctions.sendSuccess(headers, customResponse);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
** @function <b>readNotification</b> MARK NOTIFICATION AS READ
** @param {object} userData USER CREDENTIALS
** @param {object} payloadData NOTIFICATION ID FROM PAYLAOD
** @param {function} callback
* */
  async function readNotification(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {};
      if (payloadData && !payloadData.markAllAsRead) {
        criteria._id = {
          $in: payloadData.notificationID,
        };
      } else if (payloadData.isAdminNotification) {
        criteria.isAdminNotification = true;
      } else if (payloadData.notificationUserID) {
        criteria.notificationUserID = payloadData.notificationUserID;
      }
      const dataToSet = { isRead: true };
      const options = { multi: true, new: true };
      const data = await services.MongoService.updateMultiple('Notification', criteria, dataToSet, options);
      const customResponse = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RECORDS_MODIFIED_COUNT' }) + data.nModified;
      return universalFunctions.sendSuccess(headers, customResponse);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   ** @function <b>getAllNotification</b> GET ALL NOTIFICATION OF USER
   ** @param {object} userData USER CREDENTIALS
   ** @param {object} queryData QUERY PARAMETRS TO FILTER DATA
   ** @param {function} callback
   * */
  async function getAllNotification(headers, queryData) {
    try {
      const criteria = { isDeleted: false };
      const readCriteria = {
        isDeleted: false,
        isRead: false,
      };
      if (queryData.isAdminNotification) {
        criteria.isAdminNotification = true;
        readCriteria.isAdminNotification = true;
      } else if (queryData.notificationUserID) {
        criteria.notificationUserID = queryData.notificationUserID;
        readCriteria.notificationUserID = queryData.notificationUserID;
        criteria.isAdminNotification = false;
        readCriteria.isAdminNotification = false;
      }
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: { createdAt: -1 },
      };
      const promise = Promise.all([
        services.MongoService.countData('Notification', criteria),
        services.MongoService.getDataAsync('Notification', criteria, {}, options),
        services.MongoService.countData('Notification', readCriteria),
      ]);
      notificationData = await promise;
      const data = {
        notificationCount: notificationData[0],
        notifications: notificationData[1],
        unreadNotificationCount: notificationData[2],
      };
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getUnreadNotificationCount(queryData) {
    try {
      const criteria = { isDeleted: false, isRead: false };
      if (queryData.isAdminNotification) {
        criteria.isAdminNotification = true;
      } else if (queryData.notificationUserID) {
        criteria.notificationUserID = queryData.notificationUserID;
      }
      return await services.MongoService.countData('Notification', criteria);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'NotificationController',
    clearNotification,
    createNotification,
    readNotification,
    getAllNotification,
    getUnreadNotificationCount,
  };
};
