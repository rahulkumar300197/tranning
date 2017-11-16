const request = require('request');
const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  const configs = server.plugins['core-config'];

  async function verifySocialUser(headers, user) {
    return new Promise(((resolve, reject) => {
      let verificationURI;
      if (user.socialType === configs.UserConfiguration.get('/social', { type: 'facebook' })) {
        verificationURI = configs.UserConfiguration.get('/verifySocialUser', { platform: 'facebook' }) + user.accessToken;
      } else if (user.socialType === configs.UserConfiguration.get('/social', { type: 'google' })) {
        verificationURI = configs.UserConfiguration.get('/verifySocialUser', { platform: 'google' }) + user.accessToken;
      }
      // eslint-disable-next-line no-unused-vars
      request(verificationURI, (error, response, body) => {
        if (response.statusCode !== 200) {
          reject(Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'INVALID_SOCIAL_USER' })));
        } else {
          resolve(true);
        }
      });
    }));
  }

  async function socialLogin(headers, user) {
    try {
      let criteria = {};
      await verifySocialUser(headers, user);
      criteria = {
        role: user.role,
        socialAccounts: {
          $elemMatch: {
            type: user.socialType,
            socialID: user.socialID, // check for primary phone number
          },
        },
      };
      let data = await services.UserService.getUserDetails(criteria, {}, { limit: 1 });
      if (data.length > 0) {
        if (data[0].isDeleted) {
          throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'ACCOUNT_DEACTIVATED' }));
        }
        data = data[0];
      } else {
        if (user.latitude && user.longitude) {
          if (user.role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
            user.currentSPLocation = {
              type: 'Point',
              coordinates: [user.longitude, user.latitude],
            };
            await services.MongoService.createData('ServiceProvider', user);
          } else if (user.role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
            user.currentDriverLocation = {
              type: 'Point',
              coordinates: [user.longitude, user.latitude],
            };
            await services.MongoService.createData('Driver', user);
          }
        }
        socialData = {
          role: user.role,
          socialAccounts: [{
            type: user.socialType,
            socialID: user.socialID,
          }],
          isEmailVerified: true,
        };
        data = await services.MongoService.createData('User', socialData);
      }
      const sessionData = {
        user: data._id,
        deviceType: user.deviceType,
        deviceToken: user.deviceToken || null,
        remoteIP: user.ip,
      };
      const token = await services.UserService.sessionManager(user.deviceType, sessionData, data, user.role);
      const updateOptions = {
        new: true,
      };
      let dataToSet;
      if (headers.utcoffset !== data.utcoffset) {
        dataToSet = {
          utcoffset: headers.utcoffset,
          rememberMe: user.rememberMe,
        };
      } else {
        dataToSet = {
          rememberMe: user.rememberMe,
        };
      }
      services.MongoService.updateData('User', criteria, dataToSet, updateOptions);
      // Remove password before sending
      const cleanResult = JSON.parse(JSON.stringify(data));

      // eslint-disable-next-line no-underscore-dangle
      delete cleanResult.__v;
      cleanResult.contacts.forEach((x) => {
        delete x.mobileOTP;
        delete x.otpUpdatedAt;
      });
      const controllers = server.plugins['core-controller'];
      if (user.deviceType === configs.UserConfiguration.get('/deviceTypes', { type: 'web' })) {
        const permissions = await controllers.AclController.getRoleWisePermission(user.role);
        cleanResult.permissions = permissions;
      }
      cleanResult.token = token;
      return universalFunctions.sendSuccess(headers, cleanResult);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  return {
    controllerName: 'SocialController',
    socialLogin,
  };
};
