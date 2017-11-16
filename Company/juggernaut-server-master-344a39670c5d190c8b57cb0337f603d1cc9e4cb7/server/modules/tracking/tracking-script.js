const internals = {};

internals.scheduleScript = async function (server, next) {
  const services = server.plugins['core-services'];
  let noOfDays = await services.MongoService.getFirstMatch('AdminSetting', {}, { deleteTrackingData: 1 }, {});
  noOfDays = noOfDays.deleteTrackingData;
  const time = noOfDays * 86400 * 1000;
  setInterval(() => {
    services.MongoService.deleteMany('Tracking', {});
  }, time);
  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.scheduleScript);

  next();
};


exports.register.attributes = {
  name: 'trackingScript',
};
