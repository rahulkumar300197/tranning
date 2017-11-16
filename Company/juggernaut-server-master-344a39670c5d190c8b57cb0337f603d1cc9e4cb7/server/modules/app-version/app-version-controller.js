const internals = {};

exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  /**
    * @function <b>getAppVerions</b> <br>
    * Method to see the appVersion data
    * @param {function} callback   callback Function
    */
  async function getAppVerions(headers) {
    try {
      const criteria = {};
      const options = {
        lean: true,
      };
      const result = await services.MongoService.getDataAsync('AppVersion', criteria, {}, options);
      return universalFunctions.sendSuccess(headers, result);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
     * @function <b>setAppVersions</b> Method for creating or updating app version or web version
     * @param {object} payload  appVersion details for criticality and current version
     * @param {*} callback   callback Function
     */
  async function setAppVersions(headers, payload) {
    try {
      const criteria = {};
      const options = {
        new: true,
        upsert: true,
      };
      const dbData = await services.MongoService.updateData('AppVersion', criteria, payload, options);
      return universalFunctions.sendSuccess(headers, dbData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>checkCriticalAppVersions</b> <br>
   * Method for checking the criticality for the current version of app or web
   * @param {object} payload current version details of the IOS, Android or WEB
   * @param {*} callback   callback Function
   */
  async function checkCriticalAppVersions(headers, payload) {
    try {
      let criteria = {};
      const options = {};
      if (payload.deviceType === 'ANDROID') {
        criteria = {
          criticalAndroidVersion: {
            $gt: payload.currentVersion,
          },
        };
      } else if (payload.deviceType === 'IOS') {
        criteria = {
          criticalIOSVersion: {
            $gt: payload.currentVersion,
          },
        };
      } else {
        criteria = {
          criticalWebID: {
            $gt: payload.currentVersion,
          },
        };
      }
      const projections = {
        updateTitleAtPopup: 1,
        updateMessageAtPopup: 1,
      };
      const result = await services.MongoService.getDataAsync('AppVersion', criteria, projections, options);
      if (result.length > 0) {
        result[0].isCritical = true;
        return universalFunctions.sendSuccess(headers, result);
      } else if (result.length === 0) {
        return universalFunctions.sendSuccess(headers, { isCritical: false });
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'AppVersionController',
    getAppVerions,
    setAppVersions,
    checkCriticalAppVersions,
  };
};
