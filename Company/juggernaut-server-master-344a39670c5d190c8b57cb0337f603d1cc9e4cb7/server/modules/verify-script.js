const schedule = require('node-schedule');

const internals = {};

internals.verifyScript = function (server, next) {
  const services = server.plugins['core-services'];
  const controllers = server.plugins['core-controller'];
  // repeat rule for the script
  const rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = [0, 2, 4, 6];
  rule.hour = 11;
  rule.minute = 0;
  /**
     * @function <b>verifyEmailPush</b><br>Method to send email to not verified users for 5 times
     * @param {Object} rule repeating rule for the script
     * @param {function} callback
     */
  // eslint-disable-next-line no-unused-vars
  const verifyEmailPush = schedule.scheduleJob(rule, async () => {
    try {
      const criteria = {
        isEmailVerified: false,
        contacts: {
          $elemMatch: {
            isPrimary: true,
          },
        },
      };
      const projection = {
        email: 1,
        cronHardDeleteCount: 1,
        contacts: 1,
      };
      const options = {};
      const userData = await services.MongoService.getDataAsync('User', criteria, projection, options);
      if (userData) {
        userData.forEach(async (user) => {
          try {
            if (user.cronHardDeleteCount < 5) {
              const userContact = user.contacts[0];
              await controllers.UserController.sendVerificationNotification(user, userContact, 'en');
              const userID = {
                _id: user._id,
              };
              const countToUpdate = {
                $inc: {
                  cronHardDeleteCount: 1,
                },
              };
              services.MongoService.updateData('User', userID, countToUpdate, { new: true });
            } else {
              controllers.UserController.deleteUser(user);
            }
          } catch (error) {
            winstonLogger.error(error);
            throw error;
          }
        }, this);
      }
    } catch (error) {
      winstonLogger.error(error);
    }
  });
  next();
};

exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.verifyScript);
  next();
};

exports.register.attributes = {
  name: 'verifyScript',
};
