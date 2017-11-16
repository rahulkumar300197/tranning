/* eslint-disable no-console */
const internals = {};

internals.adminIntializeScript = function (server, next) {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  (async function () {
    try {
      const userRole = configs.UserConfiguration.get('/roles', { role: 'admin' });
      const firstAdmin = {
        email: process.env.ADMIN_EMAIL_1,
        password: process.env.ADMIN_PASSWORD_1,
        userName: process.env.ADMIN_USERNAME_1,
        isEmailVerified: true,
        firstName: process.env.ADMIN_FIRST_NAME,
        lastName: process.env.ADMIN_LAST_NAME,
        role: userRole,
      };
      const secondAdmin = {
        email: process.env.ADMIN_EMAIL_2,
        password: process.env.ADMIN_PASSWORD_2,
        userName: process.env.ADMIN_USERNAME_2,
        isEmailVerified: true,
        firstName: process.env.ADMIN_FIRST_NAME,
        lastName: process.env.ADMIN_LAST_NAME,
        role: userRole,
      };
      const thirdAdmin = {
        email: process.env.ADMIN_EMAIL_3,
        password: process.env.ADMIN_PASSWORD_3,
        userName: process.env.ADMIN_USERNAME_3,
        isEmailVerified: true,
        firstName: process.env.ADMIN_FIRST_NAME,
        lastName: process.env.ADMIN_LAST_NAME,
        role: userRole,
      };
      const admin = [firstAdmin, secondAdmin, thirdAdmin];
      for (let i = 0; i < admin.length; i += 1) {
        admin[i].password = universalFunctions.hashPasswordUsingBcrypt(admin[i].password);
      }
      await admin.forEach(async (adminData) => {
        const criteria = {
          email: adminData.email,
        };
        const count = await services.MongoService.countData('User', criteria);
        if (count < 1) {
          services.MongoService.createData('User', adminData);
        }
      }, this);
    } catch (error) {
      winstonLogger.error('Unable to create admin bootstrap might be cause of .env file missing exiting process', error);
      process.exit(1);
    }
  }());

  (async function () {
    try {
      const criteria = {};
      const count = await services.MongoService.countData('AdminSetting', criteria);
      if (count < 1) {
        const dataToSave = {
          otpExpiresIn: 300,
          linkExpiresIn: 300,
          deleteTrackingData: 1,
          deviceMultiSession: true,
          webMultiSession: true,
          adminTokenExpireTime: 30, // minutes
          userTokenExpireTime: 43200, // 30 days
        };
        services.MongoService.createData('AdminSetting', dataToSave);
      }
    } catch (error) {
      winstonLogger.error('Admin default settings bootstraping failed ', error);
      process.exit(1);
    }
  }());
  next();
};

exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.adminIntializeScript);
  next();
};

exports.register.attributes = {
  name: 'adminInitializeScript',
};
