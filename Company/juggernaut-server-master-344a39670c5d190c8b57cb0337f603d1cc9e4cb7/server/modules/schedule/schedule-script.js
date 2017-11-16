/* jshint node: true */
const schedule = require('node-schedule');

const internals = {};


internals.scheduleScript = function (server, next) {
  const services = server.plugins['core-services'];
  const configs = server.plugins['core-config'];
  // eslint-disable-next-line no-unused-vars
  const checkAvailability = schedule.scheduleJob('*/10 * * * *', async () => {
    let today = new Date();
    today = (today.getHours() * 60) + today.getMinutes() + today.getTimezoneOffset();
    const data = await services.MongoService.getDataAsync('Schedule', {}, {}, {});
    if (data) {
      data.forEach(async (doc) => {
        if (today >= doc.startTime && today <= doc.endTime && !doc.isNotified) {
          const idToSend = doc.serviceProviderID;
          const dataToEmit = {
            id: idToSend,
            eventType: configs.AppConfiguration.get('/NOTIFICATION', { NOTIFICATION: 'SET_AVAILABILITY' }),
          };
          process.emit('sendNotificationToServiceProvider', dataToEmit);
          await services.MongoService.updateData('Schedule', { _id: doc._id }, { isNotified: true }, { new: true });
        }
      });
    }
  });

  // at 00:00 hrs -- update notified flag
  // eslint-disable-next-line no-unused-vars
  const endOfDay = schedule.scheduleJob('0 0 0 * * *', async () => {
    await services.MongoService.updateMultiple('Schedule', { isNotified: true }, { isNotified: false }, { new: true });
  });
  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.scheduleScript);

  next();
};


exports.register.attributes = {
  name: 'scheduleScript',
};
