const Boom = require('boom');

const internals = {};

internals.customerSupportNumber = async function (server, next) {
  const services = server.plugins['core-services'];
  try {
    const customerSupport = {
      countryCode: '+1',
      mobile: '8502035832',
    };
    const checkData = await services.MongoService.getFirstMatch('CustomerSupport', {}, {}, {});
    if (!checkData) {
      services.MongoService.createData('CustomerSupport', customerSupport);
    }
  } catch (error) {
    winstonLogger.error(error);
    return cb(Boom.wrap(err));
  }
  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.customerSupportNumber);

  next();
};


exports.register.attributes = {
  name: 'customerSupportScript',
};
