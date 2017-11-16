const fs = require('fs');

const internals = {};

exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];

  async function setIPAttempt(headers, payloadData) {
    try {
      const options = {
        new: true,
        upsert: true,
      };
      const data = await services.MongoService.updateData('RequestRateLimit', {}, payloadData, options);
      const newData = {
        enabled: data.isEnabled,
        userLimit: data.userLimit,
        userCache: {
          segment: 'hapi-rate-limit-user',
          expiresIn: data.userLimitExpiresIn,
        },
        pathLimit: data.pathLimit,
        pathCache: {
          segment: 'hapi-rate-limit-path',
          expiresIn: data.pathLimitExpiresIn,
        },
      };
      await fs.writeFile(`${__dirname}/rating-constants.json`, JSON.stringify(newData), 'utf8');
      return utilityFunctions.universalFunction.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'RatingController',
    setIPAttempt,
  };
};
