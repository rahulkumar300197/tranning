const Boom = require('boom');
const Promise = require('bluebird');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const mongoose = server.plugins.bootstrap.mongoose;
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
   * @function <b>checkServiceProvider</b><br> Method for checking if SP is registered for service
   * @param {Object} payloadData  Object Containing service details
   */
  async function checkServiceProvider(payloadData) {
    try {
      const serviceID = payloadData.serviceID;
      const serviceProviderID = payloadData.serviceProviderID;
      const criteria = {
        _id: new mongoose.Types.ObjectId(serviceID),
        isDeleted: false,
        serviceProviders: {
          $elemMatch: {
            serviceProviderID,
          },
        },
      };
      const data = await services.MongoService.getFirstMatch('Service', criteria, {}, {});
      return data;
    } catch (error) {
      winstonLogger.error(error);
      return 0;
    }
  }

  // converts local time in HH:MM format to utc minutes

  function convertToUTC(time, utcOffset) {
    const n = time.split(':');
    return (((n[0] * 60) + parseInt(n[1], 10)) - utcOffset);
  }

  // checkTime is in range
  async function checkTime(payloadData) {
    if (payloadData.startTime && payloadData.endTime) {
      payloadData.startTime = convertToUTC(payloadData.startTime, payloadData.utcOffset);
      payloadData.endTime = convertToUTC(payloadData.endTime, payloadData.utcOffset);
      if (payloadData.startTime >= payloadData.endTime) {
        return true;
      }
      return false;
    }
    return false;
  }
  // check if SP is authorized for updating that schedule
  async function checkSP(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.scheduleID,
        isDeleted: false,
      };
      const SPdata = await services.MongoService.getFirstMatch('Schedule', criteria, {}, {});
      if (SPdata !== undefined && SPdata !== null) {
        if (JSON.stringify(SPdata.serviceProviderID) === JSON.stringify(payloadData.serviceProviderID)) {
          return 0;
        }
        throw Boom.forbidden(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SP_NOT_REGISTERED' }));
      } else {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SCHEDULE_DOES_NOT_EXISTS' }));
      }
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  /**
   * @function <b>Add Schedule </b><br> Method for adding schedule for a service by SP
   * @param {Object} payloadData  Object Containing schedule timings
   */

  async function addSchedule(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const preCondition = Promise.join(checkTime(payloadData), checkServiceProvider(payloadData), async (TimeData, serviceProviderData) => {
        if (TimeData) {
          throw Boom.rangeNotSatisfiable(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INVALID_TIME_RANGE' }));
        }
        if (serviceProviderData) {
          const criteria = {
            serviceID: payloadData.serviceID,
            serviceProviderID: payloadData.serviceProviderID,
            isDeleted: false,
          };
          const scheduleData = await services.MongoService.getFirstMatch('Schedule', criteria, {}, {});
          if (scheduleData === null || scheduleData === undefined) {
            return;
          }
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SCHEDULE_ALREADY_EXISTS' }));
        } else {
          throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_NOT_EXIST' }));
        }
      });
      await preCondition;
      delete payloadData.utcOffset;
      delete payloadData.ip;
      const data = await services.MongoService.createData('Schedule', payloadData);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>Get all Schedule </b><br> Method schedules belonging to a service or in a given time range
   * @param {Object} payloadData  Object Containing filter for listing
   */

  async function getAllSchedule(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const options = {
        limit: payloadData.limit || configs.AppConfiguration.get('/DATABASE', {
          DATABASE: 'LIMIT',
        }),
        skip: payloadData.skip || 0,
        sort: {
          _id: -1,
        },
      };
      //eslint-disable-next-line
      async function preCondition() {
        const criteria = {};
        if (payloadData.isDeleted && payloadData.isDeleted !== 'all') {
          criteria.isDeleted = payloadData.isDeleted;
        }
        if (payloadData.serviceID) {
          criteria.serviceID = payloadData.serviceID;
        }
        if (payloadData.startTime) {
          payloadData.startTime = convertToUTC(payloadData.startTime, payloadData.utcOffset);
          criteria.startTime = {
            $gte: payloadData.startTime,
          };
          if (payloadData.endTime) {
            payloadData.endTime = convertToUTC(payloadData.endTime, payloadData.utcOffset);
            criteria.endTime = {
              $lte: payloadData.endTime,
            };
            if (payloadData.startTime >= payloadData.endTime) {
              throw Boom.rangeNotSatisfiable(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INVALID_TIME_RANGE' }));
            }
          }
        }
        return criteria;
      }
      const criteria = await preCondition(payloadData);
      const data = await services.MongoService.getDataAsync('Schedule', criteria, {}, options);
      if (data === undefined || data === null) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NO_SCHEDULE_AVAILABLE' }));
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function deleteSchedule(service, dataToUpdate) {
    try {
      const options = {
        multi: true,
        new: true,
      };
      const criteria = {
        serviceID: service,
      };
      return services.MongoService.updateMultiple('Schedule', criteria, dataToUpdate, options);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }
  /**
   * @function <b>Update Schedule </b><br> Method for updating existing schedule for a service by SP
   * @param {Object} userData  Object Containing schedule timings
   */

  async function updateSchedule(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      //eslint-disable-next-line
      const preCondition = Promise.join(checkTime(payloadData), checkSP(headers, payloadData), (checkTimeData, checkSPdata) => {
        if (checkTimeData) {
          throw Boom.rangeNotSatisfiable(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INVALID_TIME_RANGE' }));
        }
      });
      await preCondition;
      const criteria = {
        _id: payloadData.scheduleID,
      };
      const options = {
        new: true,
      };
      delete payloadData.scheduleID;
      delete payloadData.utcOffset;
      delete payloadData.serviceProviderID;

      const data = await services.MongoService.updateData('Schedule', criteria, payloadData, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b> Toggle Availability </b><br> Method for setting Availability by SP for service
   * @param {Object} payloadData  Object Containing service detail
   */


  async function toggleAvailability(headers, payloadData) {
    try {
      const SPdata = await checkServiceProvider(payloadData);
      if (SPdata) {
        const criteria = {
          _id: payloadData.serviceID,
          isDeleted: false,
          serviceProviders: {
            $elemMatch: {
              serviceProviderID: payloadData.serviceProviderID,
            },
          },
        };
        const dataToSave = {
          'serviceProviders.$.isAvailable': payloadData.isAvailable,
        };
        const options = {
          new: true,
        };
        const data = await services.MongoService.updateData('Service', criteria, dataToSave, options);
        return universalFunctions.sendSuccess(headers, data);
      }

      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_NOT_EXIST' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
   * @function <b>Check Schedule </b><br> Method for checking Availability of SP for a service
   * @param {Object} payloadData  Object Containing service details
   */
  async function checkSchedule(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const SPdata = await checkServiceProvider(payloadData);
      if (!SPdata) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_NOT_EXIST' }));
      }
      const criteria = {
        _id: payloadData.serviceID,
        isDeleted: false,
        serviceProviders: {
          $elemMatch: {
            serviceProviderID: payloadData.serviceProviderID,
          },
        },
      };
      const projection = {
        'serviceProviders.$.isAvailable': 1,
      };
      const options = {
        limit: 1,
      };
      const result = await services.MongoService.getFirstMatch('Service', criteria, projection, options);
      let flag = result.serviceProviders[0].isAvailable;
      if (flag) {
        flag = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'IS_AVAILABLE' });
        return universalFunctions.sendSuccess(headers, flag);
      }

      let today = new Date();
      today = (today.getHours() * 60) + today.getMinutes();
      const serviceCriteria = {
        serviceID: payloadData.serviceID,
        serviceProviderID: payloadData.serviceProviderID,
        isDeleted: false,
      };
      const scheduleData = await services.MongoService.getFirstMatch('Schedule', serviceCriteria, {}, {});
      if (scheduleData === null || scheduleData === undefined) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SCHEDULE_DOES_NOT_EXISTS' }));
      } else if (today >= scheduleData.startTime && today <= scheduleData.endTime) {
        const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'IS_AVAILABLE' });
        return universalFunctions.sendSuccess(headers, data);
      }
      {
        const data = await configs.MessageConfiguration.get('/lang', { locale: lang, message: 'IS_NOT_AVAILABLE' });
        return universalFunctions.sendSuccess(headers, data);
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'ScheduleController',
    addSchedule,
    getAllSchedule,
    deleteSchedule,
    updateSchedule,
    toggleAvailability,
    checkSchedule,
  };
};
