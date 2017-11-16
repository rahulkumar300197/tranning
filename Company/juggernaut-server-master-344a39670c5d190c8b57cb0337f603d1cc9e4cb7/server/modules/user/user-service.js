const Jwt = P.promisifyAll(require('jsonwebtoken'));
const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const models = server.plugins['core-models'];
  const userModel = models.User;
  const sessionModel = models.Session;

  async function getUserDetails(user, projection, options) {
    const data = await userModel.find(user, projection, options)
      .populate('customerID')
      .populate('customerAddressID')
      .populate('driverID')
      .populate('driverAddressID')
      .populate('serviceProviderID')
      .populate('serviceProviderAddressID')
      .execAsync();
    return data;
  }

  async function setSession(session, time) {
    let myArray;
    let verify;
    if (session.user) {
      myArray = (session.user && session.user.contacts) || [];
      verify = myArray.some(elem => elem.isVerified === true);
      criteriaForJwt = {
        userID: session.user._id,
        role: session.role,
        sessionID: session.session._id,
        date: new Date(),
      };
    }
    const expireTime = {
      expiresIn: time * 60,
    };
    const token = Jwt.signAsync(criteriaForJwt, configs.AppConfiguration.get('/JWT_SECRET_KEY'), expireTime);

    const criteriaForSession = {
      _id: session.session._id,
    };

    const setQuery = {
      deviceType: session.session.deviceType || null,
      deviceToken: session.session.deviceToken || null,
      isPhoneVerified: verify,
    };
    const options = {
      new: true,
    };

    services.MongoService.updateData('Session', criteriaForSession, setQuery, options);
    return token;
  }

  async function expireSession(headers, sessionData) {
    try {
      const lang = headers['content-language'];
      if (!sessionData) {
        throw configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SESSION_EXPIRED' });
      } else {
        const criteria = {
          _id: sessionData.sessionID,
        };
        await services.MongoService.deleteData('Session', criteria);
        return configs.MessageConfiguration.get('/lang', { locale: lang, message: 'LOGOUT' });
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getSessionToken(user, token) {
    try {
      const criteria = {
        user: user.userID,
        _id: user.sessionID,
      };
      const session = await sessionModel.findOne(criteria).populate('user').execAsync();
      if (session) {
        if (session.user && session.user.isDeleted) {
          throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'ACCOUNT_DEACTIVATED' }));
        } else if (session.user && !(session.user.isEmailVerified || session.user.isPhoneVerified)) {
          throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'EMAIL_NOT_ACTIVATED' }));
        } else if (session.user && session.user.isBlocked) {
          throw Boom.forbidden(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'EMAIL_BLOCKED' }));
        }
        session.role = user.role;
        session.token = token;
        return session;
      }
      throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'INVALID_TOKEN' }));
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function decodeSessionToken(token) {
    try {
      const decodedToken = await Jwt.verifyAsync(token, configs.AppConfiguration.get('/JWT_SECRET_KEY'));
      return decodedToken;
    } catch (error) {
      winstonLogger.error(error);
      throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'INVALID_TOKEN' }));
    }
  }

  async function verifySession(token) {
    let decodedToken;
    try {
      decodedToken = await Jwt.verifyAsync(token, configs.AppConfiguration.get('/JWT_SECRET_KEY'));
      const userData = await getSessionToken(decodedToken, token);
      return userData;
    } catch (error) {
      winstonLogger.error(error);
      if (!decodedToken) {
        throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'INVALID_TOKEN' }));
      }
      throw Boom.wrap(error);
    }
  }

  async function webSession(webMultiSession, sessionData, userData, role, time) {
    try {
      if (webMultiSession) {
        const newSession = await services.MongoService.createData('Session', sessionData);
        const dataToSend = {
          session: newSession,
          user: userData,
          role,
        };
        return setSession(dataToSend, time);
      }
      const criteria = {
        user: sessionData.user,
        deviceType: configs.UserConfiguration.get('/deviceTypes', { type: 'web' }),
      };
      await services.MongoService.deleteMany('Session', criteria);
      const newSession = await services.MongoService.createData('Session', sessionData);
      const dataToSend = {
        session: newSession,
        user: userData,
        role,
      };
      return setSession(dataToSend, time);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function deviceSession(deviceMultiSession, sessionData, userData, role, time) {
    try {
      if (deviceMultiSession) {
        const newSession = await services.MongoService.createData('Session', sessionData);
        const dataToSend = {
          session: newSession,
          user: userData,
          role,
        };
        return setSession(dataToSend, time);
      }
      const criteria = {
        user: sessionData.user,
        deviceType: { $ne: configs.UserConfiguration.get('/deviceTypes', { type: 'web' }) },
      };
      await services.MongoService.deleteMany('Session', criteria);
      const newSession = await services.MongoService.createData('Session', sessionData);
      const dataToSend = {
        session: newSession,
        user: userData,
        role,
      };
      return setSession(dataToSend, time);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function sessionManager(deviceType, sessionData, userData, role) {
    try {
      const projection = {
        webMultiSession: 1,
        deviceMultiSession: 1,
        adminTokenExpireTime: 1,
        userTokenExpireTime: 1,
      };
      let time;
      const adminData = await services.MongoService.getFirstMatch('AdminSetting', {}, projection, {});
      if (role === configs.UserConfiguration.get('/roles', { role: 'admin' })) {
        time = adminData.adminTokenExpireTime;
      } else {
        time = adminData.userTokenExpireTime;
      }
      if (deviceType === configs.UserConfiguration.get('/deviceTypes', { type: 'web' })) {
        return webSession(adminData.webMultiSession, sessionData, userData, role, time);
      }
      return deviceSession(adminData.deviceMultiSession, sessionData, userData, role, time);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function expireAllActiveSessions(headers, userID) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        user: userID,
      };
      await services.MongoService.deleteMany('Session', criteria);
      return configs.MessageConfiguration.get('/lang', { locale: lang, message: 'ALL_SESSION_EXPIRED' });
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    serviceName: 'UserService',
    getUserDetails,
    setSession,
    expireSession,
    getSessionToken,
    decodeSessionToken,
    verifySession,
    sessionManager,
    expireAllActiveSessions,
  };
};
