const fs = P.promisifyAll(require('fs'));
const customMessages = require('./multilingual-messages.json');

const internals = {};


// TODO  Refining error messages
exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const config = server.plugins['core-config'];
  async function manipulateData(data) {
    const temp = {};
    temp.$filter = 'locale';
    for (let i = 0; i < data.length; i += 1) {
      temp[data[i].locale] = {};
      temp[data[i].locale].$filter = 'message';
      for (let j = 0; j < data[i].messages.length; j += 1) {
        temp[data[i].locale][data[i].messages[j].messageKey] = data[i].messages[j].customMessage;
      }
    }
    return temp;
  }

  async function updateMessageConfig() {
    try {
      const englishMessages = customMessages[0].en;
      const arabicMessages = customMessages[0].ar;

      const defaultCriteria = {
        locale: '$default',
      };
      const englishCriteria = {
        locale: 'en',
      };
      const arabicCriteria = {
        locale: 'ar',
      };
      const options = {
        upsert: true,
        new: true,
      };
      const defaultData = {
        locale: '$default',
        localeName: 'english',
        isActive: true,
        $addToSet: {
          messages: { $each: englishMessages },
        },
      };
      const english = {
        locale: 'en',
        localeName: 'english',
        isActive: true,
        $addToSet: {
          messages: { $each: englishMessages },
        },
      };

      const arabic = {
        locale: 'ar',
        localeName: 'arabic',
        isActive: true,
        $addToSet: {
          messages: { $each: arabicMessages },
        },
      };

      promise = Promise.all([
        services.MongoService.updateData('multilingual', englishCriteria, english, options),
        services.MongoService.updateData('multilingual', arabicCriteria, arabic, options),
        services.MongoService.updateData('multilingual', defaultCriteria, defaultData, options),
      ]);

      const multilingualData = await promise;
      const result = await manipulateData(multilingualData);
      const json = JSON.stringify(result);
      await fs.writeFileAsync(`${__dirname}/../../config/messages.json`, json, 'utf8');
      config.MessageConfiguration.cacheClear();
      return;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  updateMessageConfig();

  return {
    serviceName: 'MultilingualService',
    updateMessageConfig,
  };
};
