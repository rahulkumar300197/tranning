const Path = require('path');
const Joi = require('joi');
const Boom = require('boom');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;


  server.route({
    method: 'POST',
    path: '/user/login',
    async handler(request, reply) {
      const payloadData = request.payload;
      payloadData.ip = request.info.remoteAddress;
      const headers = request.headers;
      if ((payloadData.deviceType !== configs.UserConfiguration.get('/deviceTypes', { type: 'web' })) && (!payloadData.deviceToken)) {
        // eslint-disable-next-line max-len
        return reply(Boom.badData(configs.MessageConfiguration.get('/lang', { locale: headers['content-language'], message: 'DEVICE_TOKEN_MISSING' })));
      }
      const data = await controllers.UserController.login(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Login Via Email & Password For  User',
      tags: ['api', 'user'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
          utcoffset: Joi.number().required().description('utc offset'),
        }).unknown(),
        payload: {
          email: Joi.string().optional(),
          primaryMobile: Joi.string().regex(/^[0-9]+$/).min(5).optional(),
          role: Joi.string().required().description('type of the user')
            .valid([
              configs.UserConfiguration.get('/roles', { role: 'customer' }),
              configs.UserConfiguration.get('/roles', { role: 'driver' }),
              configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
              configs.UserConfiguration.get('/roles', { role: 'admin' }),
            ]).description('role of user'),
          password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/).min(8).required().description('password must contain at least one capital letter, small letter, digit with minimum 8 character')
            .options({
              language: {
                string: {
                  regex: {
                    base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                  },
                },
              },
            }),
          deviceToken: Joi.string().optional().allow(''),
          appVersion: Joi.string().trim(),
          rememberMe: Joi.boolean().optional(),
          deviceType: Joi.string().required().description('type of the device current using')
            .valid([configs.UserConfiguration.get('/deviceTypes', {
              type: 'web',
            }), configs.UserConfiguration.get('/deviceTypes', {
              type: 'ios',
            }),
            configs.UserConfiguration.get('/deviceTypes', {
              type: 'android',
            }),
            ]),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'POST',
    path: '/user/uploadFile',
    async handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      const data = await controllers.UserController.uploadImage(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Upload File',
      auth: false,
      tags: ['api', 'user'],
      payload: {
        maxBytes: 5000000,
        parse: true,
        output: 'file',
      },
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          image: Joi.any()
            .meta({
              swaggerType: 'file',
            })
            .required()
            .description('image file'),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'POST',
    path: '/user/accessTokenLogin',
    async handler(request, reply) {
      const userID = { _id: request.auth.credentials.UserSession.user._id };
      const role = request.auth.credentials.scope;
      const headers = request.headers;
      const payloadData = request.payload;
      const remoteIP = request.info.remoteAddress;
      const data = await controllers.UserController.accessTokenLogin(headers, payloadData, userID, role, remoteIP);
      return reply(data);
    },
    config: {
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          // appVersion: Joi.string().trim(),
          // deviceName: Joi.string().optional().trim().description('Device name'),
          // deviceToken: Joi.string().optional().allow(''),
          deviceType: Joi.string().required().description('type of the device currently using')
            .valid([configs.UserConfiguration.get('/deviceTypes', {
              type: 'web',
            }), configs.UserConfiguration.get('/deviceTypes', {
              type: 'ios',
            }),
            configs.UserConfiguration.get('/deviceTypes', {
              type: 'android',
            }),
            ]),
        },
      },
      auth: {
        strategy: 'JwtAuth',
      },
      description: 'get details with token',
      tags: ['api', 'user'],
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          payloadType: 'form',
        },
      },
    },

  });

  server.route({
    method: 'PUT',
    path: '/user/changePassword',
    async handler(request, reply) {
      const payloadData = request.payload;
      const userData = request.auth.credentials.UserSession.user;
      const headers = request.headers;
      if (request.payload.oldPassword === request.payload.newPassword) {
        return reply(Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: headers['content-language'], message: 'SAME_PASSWORD' })));
      }
      const data = await controllers.UserController.changePassword(headers, payloadData, userData);
      return reply(data);
    },
    config: {
      description: 'Change Password',
      tags: ['api', 'user'],
      auth: 'JwtAuth',
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        payload: {
          oldPassword: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/).min(8).required().description('password must contain at least one capital letter, small letter, digit with minimum 8 character')
            .options({
              language: {
                string: {
                  regex: {
                    base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                  },
                },
              },
            }),
          newPassword: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/).min(8).required().description('password must contain at least one capital letter, small letter, digit with minimum 8 character')
            .options({
              language: {
                string: {
                  regex: {
                    base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                  },
                },
              },
            }),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/user/getResetPasswordToken',
    async handler(request, reply) {
      const email = request.query.email;
      const headers = request.headers;
      const data = await controllers.UserController.getResetPasswordToken(headers, email);
      return reply(data);
    },
    config: {
      description: 'Sends Reset Password Token To User',
      tags: ['api', 'user'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          email: Joi.string().email().required(),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/user/forgotPasswordMobile',
    async handler(request, reply) {
      const queryData = request.query;
      const headers = request.headers;
      const data = await controllers.UserController.forgotPasswordOTP(headers, queryData);
      return reply(data);
    },
    config: {
      description: 'Sends Reset Password Token To User',
      tags: ['api', 'user'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          countryCode: Joi.string().required(),
          mobile: Joi.string().required(),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'PUT',
    path: '/user/verifyForgotPasswordOTP',
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.UserController.getResetPasswordTokenWithOTP(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Sends Reset Password Token To User',
      tags: ['api', 'user'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          countryCode: Joi.string().required(),
          mobile: Joi.string().required(),
          OTP: Joi.number().required(),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route(
    {
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: Path.join(__dirname, '../../../client/dist'),
        },
      },
      config: {
        description: 'for front end static rendering',
        tags: ['api', 'user'],
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'GET',
      path: '/angular4-docs/{param*}',
      handler: {
        directory: {
          path: Path.join(__dirname, '../../../client/docs/build/'),
        },
      },
      config: {
        description: 'for angular 4 docs',
        tags: ['api', 'user'],
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route({
    method: 'PUT',
    path: '/user/resetPassword',
    async handler(request, reply) {
      const payloadData = request.payload;
      const headers = request.headers;
      const data = await controllers.UserController.resetPassword(headers, payloadData);
      return reply(data);
    },
    config: {
      description: 'Reset Password',
      tags: ['api', 'user'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          passwordResetToken: Joi.string().required(),
          newPassword: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/).min(8).required().description('password must contain at least one capital letter, small letter, digit with minimum 8 character')
            .options({
              language: {
                string: {
                  regex: {
                    base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                  },
                },
              },
            }),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route(
    {
      method: 'PUT',
      path: '/user/setPassword',
      async handler(request, reply) {
        const payloadData = request.payload;
        const headers = request.headers;
        const data = await controllers.UserController.setPassword(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'set Password',
        tags: ['api', 'user'],
        validate: {
          headers: Joi.object({
            'content-language': Joi.string().required().description('en/ar'),
          }).unknown(),
          payload: {
            emailVerificationToken: Joi.string().required(),
            password: Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{5,}$/).min(8).required().description('password must contain at least one capital letter, small letter, digit with minimum 8 character')
              .options({
                language: {
                  string: {
                    regex: {
                      base: 'must contain at least one capital letter, small letter, digit with minimum 8 characters',
                    },
                  },
                },
              }),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            payloadType: 'form',
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'GET',
      path: '/user/verifyEmail',
      async handler(request, reply) {
        const queryData = request.query;
        const headers = {
          'content-langugage': request.query.lang,
        };
        const data = await controllers.UserController.emailVerify(headers, queryData);
        return reply(data);
      },
      config: {
        description: 'Verify Email',
        tags: ['api', 'user'],
        validate: {
          query: {
            lang: Joi.string().required(),
            emailVerificationToken: Joi.string().required(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'PUT',
      path: '/user/resendOTP',
      async handler(request, reply) {
        const payloadData = request.payload;
        const headers = request.headers;
        const sessionData = request.auth.credentials.tokenData;
        const data = await controllers.UserController.verifyAndResendOTP(headers, payloadData, sessionData);
        return reply(data);
      },
      config: {
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          },
        },

        description: 'Resend OTP for Driver',
        tags: ['api', 'user'],
        auth: 'preVerificationAuth',
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'PUT',
      path: '/user/resendEmail',
      async handler(request, reply) {
        const headers = request.headers;
        const sessionData = request.auth.credentials.tokenData;
        const data = await controllers.UserController.resendEmail(headers, sessionData);
        return reply(data);
      },
      config: {
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
        },

        description: 'Resend email verify link',
        tags: ['api', 'user'],
        auth: 'preVerificationAuth',
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  // add phone number
  server.route(
    {
      method: 'PUT',
      path: '/user/addPhoneNumber',
      async handler(request, reply) {
        const payloadData = request.payload;
        const headers = request.headers;
        const userData = request.auth.credentials.UserSession.user;
        const data = await controllers.UserController.addPhoneNumber(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Add Phone Number',
        tags: ['api', 'user'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            countryCode: Joi.string().max(4).required().trim().description('+91'),
            mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        pre: [{
          assign: 'phoneCheck',
          async method(request, reply) {
            try {
              const newPhone = {
                mobile: request.payload.mobile,
                userID: request.auth.credentials.UserSession.user._id,
              };
              const lang = request.headers['content-language'];
              await controllers.UserController.phoneCheck(newPhone, lang);
              return reply(true);
            } catch (error) {
              return reply(error);
            }
          },
        }],
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'PUT',
      path: '/user/setPrimaryNumber',
      async handler(request, reply) {
        const payloadData = request.payload;
        const headers = request.headers;
        const userData = request.auth.credentials.UserSession.user;
        const data = await controllers.UserController.setPrimaryNumber(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'set primary number',
        tags: ['api', 'user'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            countryCode: Joi.string().max(4).required().trim(),
            mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'PUT',
      path: '/user/updateUTCoffset',
      async handler(request, reply) {
        const headers = request.headers;
        const userData = request.auth.credentials.UserSession.user;
        const data = await controllers.UserController.updateUTCoffset(headers, userData);
        return reply(data);
      },
      config: {
        description: 'update UTC offset',
        tags: ['api', 'user'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          headers: Joi.object({
            authorization: Joi.string().required().description('Bearer Token'),
            'content-language': Joi.string().required().description('en/ar'),
            utcoffset: Joi.number().required().description('utc offset'),
          }).unknown(),
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'PUT',
      path: '/user/updateDeviceToken',
      async handler(request, reply) {
        const payloadData = request.payload;
        const headers = request.headers;
        const userData = request.auth.credentials.UserSession.user;
        const data = await controllers.UserController.updateDeviceToken(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'update device token',
        tags: ['api', 'user'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          payload: {
            deviceToken: Joi.string().required().trim().description('android/ios device token'),
            role: Joi.string().required().description('type of the user')
              .valid([
                configs.UserConfiguration.get('/roles', { role: 'customer' }),
                configs.UserConfiguration.get('/roles', { role: 'driver' }),
                configs.UserConfiguration.get('/roles', { role: 'serviceProvider' }),
              ]).description('role of user'),
          },
          headers: Joi.object({
            authorization: Joi.string().required().description('Bearer Token'),
            'content-language': Joi.string().required().description('en/ar'),
          }).unknown(),
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'PUT',
      path: '/user/verifyMobileOTP',
      async handler(request, reply) {
        const payloadData = request.payload;
        const headers = request.headers;
        const sessionData = request.auth.credentials.tokenData;
        const data = await controllers.UserController.checkAndVerifyOTP(headers, payloadData, sessionData);
        return reply(data);
      },
      config: {
        description: 'Verify OTP for mobile',
        tags: ['api', 'user'],
        auth: {
          strategy: 'preVerificationAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
            OTPCode: Joi.number().min(1000).max(9999).required(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route({
    method: 'DELETE',
    path: '/user/deleteUser/{lang}/{email}',
    async handler(request, reply) {
      const paramsData = request.params;
      const headers = {
        'content-language': request.params.lang,
      };
      const data = await controllers.UserController.deleteUser(headers, paramsData);
      return reply(data);
    },
    config: {
      description: 'Hard Delete User for tester only',
      auth: false,
      tags: ['api', 'user'],
      validate: {
        params: {
          lang: Joi.string().required().description('en/ar'),
          email: Joi.string().email().required(),
        },
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route(
    {
      method: 'PUT',
      path: '/user/updatePhoneNumber',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const userData = request.auth.credentials.UserSession.user;
        if (payloadData.oldMobile === payloadData.newMobile) {
          return reply(Boom.conflict(configs.MessageConfiguration.get('/lang',
            { locale: headers['content-language'], message: 'SAME_MOBILE_NUMBER' })));
        }
        const data = await controllers.UserController.updatePhoneNumber(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'Update Phone Number',
        tags: ['api', 'user'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            oldMobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
            countryCode: Joi.string().max(4).required().trim().description('+91'),
            newMobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'DELETE',
      path: '/user/deletePhoneNumber',
      async handler(request, reply) {
        const payloadData = request.payload;
        const userData = request.auth.credentials.UserSession.user;
        const headers = request.headers;
        const data = await controllers.UserController.deletePhoneNumber(headers, payloadData, userData);
        return reply(data);
      },
      config: {
        description: 'delete Phone Number',
        tags: ['api', 'user'],
        auth: {
          strategy: 'JwtAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            mobile: Joi.string().regex(/^[0-9]+$/).min(5).required(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    }
  );

  server.route(
    {
      method: 'PUT',
      path: '/user/contactUs',
      async handler(request, reply) {
        const payloadData = request.payload;
        const headers = request.headers;
        const data = await controllers.UserController.contactUs(headers, payloadData);
        return reply(data);
      },
      config: {
        description: 'Contact Us',
        tags: ['api', 'user'],
        auth: {
          strategy: 'preVerificationAuth',
        },
        validate: {
          headers: universalFunctions.authorizationHeaderObj,
          payload: {
            name: Joi.string().regex(/^[a-zA-Z ]+$/).trim().min(2).required(),
            email: Joi.string().email().required(),
            query: Joi.string().required(),
          },
          failAction: universalFunctions.failActionFunction,
        },
        plugins: {
          'hapi-swagger': {
            payloadType: 'form',
            responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
          },
        },
      },
    });

  server.route({
    method: 'POST',
    path: '/user/logout',
    async handler(request, reply) {
      const headers = request.headers;
      const sessionData = request.auth.credentials.tokenData;
      const remoteIP = request.info.remoteAddress;
      const data = await controllers.UserController.userLogout(headers, sessionData, remoteIP);
      return reply(data);
    },
    config: {
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
      },
      auth: {
        strategy: 'preVerificationAuth',
      },
      description: 'Logout user',
      tags: ['api', 'user'],
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/user/getWallet',
    async handler(request, reply) {
      const userData = request.auth.credentials.UserSession.user;
      const headers = request.headers;
      const data = await controllers.UserController.getUserWalllet(headers, userData);
      return reply(data);
    },
    config: {
      description: 'Get wallet data for user',
      tags: ['api', 'user'],
      auth: {
        strategy: 'JwtAuth',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/user/getReferralCode',
    async handler(request, reply) {
      const userData = request.auth.credentials.UserSession.user;
      const headers = request.headers;
      const data = await controllers.UserController.getReferralCode(headers, userData);
      return reply(data);
    },
    config: {
      description: 'Get referral code for user',
      tags: ['api', 'user'],
      auth: {
        strategy: 'JwtAuth',
      },
      validate: {
        headers: universalFunctions.authorizationHeaderObj,
        failAction: universalFunctions.failActionFunction,
      },
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });

  server.route({
    method: 'GET',
    path: '/user/pingMe',
    async handler(request, reply) {
      const success = {
        statusCode: 200,
        message: null,
        data: null,
      };
      return reply(success);
    },
    config: {
      description: 'Ping Server',
      tags: ['api', 'user'],
      plugins: {
        'hapi-swagger': {
          responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages'),
        },
      },
    },
  });


  next();
};


exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'users',
};
