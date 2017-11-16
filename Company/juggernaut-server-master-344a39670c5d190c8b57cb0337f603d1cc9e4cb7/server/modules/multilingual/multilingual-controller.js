

const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  async function addLocale(headers, payloadData) {
    try {
      const criteria = {
        locale: '$default',
      };
      const projection = {
        messages: 1,
        _id: 0,
      };
      const messagesData = await services.MongoService.getDataAsync('multilingual', criteria, projection, {});
      if (messagesData) {
        const localeCriteria = {
          locale: payloadData.locale,
        };
        payloadData.isActive = true;
        payloadData.messages = messagesData[0].messages;
        const options = {
          upsert: true,
          new: true,
        };
        const updateData = Promise.all([
          services.MongoService.updateData('multilingual', localeCriteria, payloadData, options),
          services.MultilingualService.updateMessageConfig(),
        ]);
        const data = await updateData;
        if (data[1]) {
          configs.MessageConfiguration.cacheClear();
        }
        return universalFunctions.sendSuccess(headers, data[0]);
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getAllLocales() {
    try {
      const headers = {
        'content-languange': 'en',
      };
      const criteria = { isActive: true };
      const options = {
        // asked to remove by frontend
        // limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        // skip: queryData.skip || 0,
        sort: {
          createdAt: -1,
        },
      };
      const projection = {};
      const data = await services.MongoService.getDataAsync('multilingual', criteria, projection, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function controlLocale(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        locale: payloadData.locale,
      };
      const dataToSave = {
        isActive: payloadData.isActive,
      };
      const options = {
        new: true,
        upsert: true,
      };
      const updateData = await services.MongoService.updateData('multilingual', criteria, dataToSave, options);
      if (updateData) {
        configs.MessageConfiguration.cacheClear();
        const customResponse = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UPDATED' });
        return universalFunctions.sendSuccess(headers, customResponse);
      }
      throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NOT_UPDATED' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function addApplicationURIs(headers, payloadData) {
    try {
      const criteria = {
        locale: payloadData.locale,
        messages: {
          $elemMatch: {
            messageKey: payloadData.messageKey,
          },
        },
      };
      const dataToSave = {
        isResourceBundleURI: true,
        'messages.$.customMessage': payloadData.customMessage,
      };
      const options = {
        new: true,
        upsert: true,
      };
      const projection = {
        messages: 1,
      };
      const data = await services.MongoService.getDataAsync('multilingual', criteria, projection, {});
      if (data.length > 0) {
        const updateData = Promise.all([
          services.MongoService.updateData('multilingual', criteria, dataToSave, options),
          services.MultilingualService.updateMessageConfig(),
        ]);
        const multilingualData = await updateData;
        configs.MessageConfiguration.cacheClear();
        return universalFunctions.sendSuccess(headers, multilingualData[0]);
      }
      const localeID = {
        locale: payloadData.locale,
      };
      const message = {
        $push: {
          messages: {
            messageKey: payloadData.messageKey,
            customMessage: payloadData.customMessage,
            isResourceBundleURI: true,
          },
        },
      };
      const updateData = Promise.all([
        services.MongoService.updateData('multilingual', localeID, message, options),
        services.MultilingualService.updateMessageConfig(),
      ]);
      const multilingualData = await updateData;
      configs.MessageConfiguration.cacheClear();
      return universalFunctions.sendSuccess(headers, multilingualData[0]);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function addBackendMessages(headers, payloadData) {
    try {
      const criteria = {
        locale: payloadData.locale,
        messages: {
          $elemMatch: {
            messageKey: payloadData.messageKey,
          },
        },
      };
      const dataToSave = {
        isResourceBundleURI: false,
        'messages.$.customMessage': payloadData.customMessage,
      };
      const options = {
        new: true,
        upsert: true,
      };
      const projection = {
        messages: 1,
      };
      const data = await services.MongoService.getDataAsync('multilingual', criteria, projection, {});
      if (data.length > 0) {
        const updateData = Promise.all([
          services.MongoService.updateData('multilingual', criteria, dataToSave, options),
          services.MultilingualService.updateMessageConfig(),
        ]);
        const multilingualData = await updateData;
        configs.MessageConfiguration.cacheClear();
        return universalFunctions.sendSuccess(headers, multilingualData[0]);
      }
      const localeID = {
        locale: payloadData.locale,
      };
      const message = {
        $push: {
          messages: {
            messageKey: payloadData.messageKey,
            customMessage: payloadData.customMessage,
            isResourceBundleURI: false,
          },
        },
      };
      const updateData = Promise.all([
        services.MongoService.updateData('multilingual', localeID, message, options),
        services.MultilingualService.updateMessageConfig(),
      ]);
      const multilingualData = await updateData;
      configs.MessageConfiguration.cacheClear();
      return universalFunctions.sendSuccess(headers, multilingualData[0]);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getApplicationURIs(headers) {
    try {
      const lang = headers['content-language'];
      const appURI = [];
      const uriData = [{
        $match: { locale: lang, isActive: true },
      },
      {
        $project: { messages: 1, _id: 0 },
      },
      { $unwind: '$messages' },
      { $match: { 'messages.isResourceBundleURI': true } },
      ];
      const aggregateData = await services.MongoService.aggregateData('multilingual', uriData);
      if (aggregateData) {
        for (let i = 0; i < aggregateData.length; i += 1) {
          appURI.push(aggregateData[i].messages);
        }
      } else {
        const defaultData = [{
          $match: { locale: '$default' },
        },
        {
          $project: { messages: 1, _id: 0 },
        },
        { $unwind: '$messages' },
        {
          $match: { 'messages.isResourceBundleURI': true },
        }];
        const aggregatedData = await services.MongoService.aggregateData('multilingual', defaultData);
        for (let i = 0; i < aggregatedData.length; i += 1) {
          appURI.push(aggregatedData[i].messages);
        }
      }
      return universalFunctions.sendSuccess(headers, appURI);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'MultilingualController',
    addLocale,
    getAllLocales,
    controlLocale,
    addApplicationURIs,
    getApplicationURIs,
    addBackendMessages,
  };
};
