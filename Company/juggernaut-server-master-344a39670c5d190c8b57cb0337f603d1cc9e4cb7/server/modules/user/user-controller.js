const Boom = require('boom');
const bcrypt = P.promisifyAll(require('bcrypt'));
const shortid = require('shortid');
const rand = require('unique-random')(1000, 9999);

const internals = {};
// eslint-disable
exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
  * @function <b>login</b><br>Method For Unified Login of Entities
  * @param {Object} user Object Containing Login User Details
  */
  async function login(headers, user) {
    try {
      const lang = headers['content-language'];
      if (!(user.email || user.primaryMobile)) {
        throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      let criteria = {};
      // setting criteria for email or phone number
      if (!user.email) {
        criteria = {
          role: user.role,
          mobile: user.primaryMobile,
        };
      } else {
        criteria = {
          email: user.email,
          role: user.role,
        };
      }
      const projection = {
        emailVerificationToken: 0,
        emailVerificationTokenUpdatedAt: 0,
        __v: 0,
      };
      const data = await services.UserService.getUserDetails(criteria, projection, { limit: 1 });
      if (data.length > 0) {
        if (data[0].isDeleted) {
          throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: 'en', message: 'ACCOUNT_DEACTIVATED' }));
        }
        
        const result = await bcrypt.compare(user.password, data[0].password);
        if (!result) {
          throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'EMAIL_PASSWORD_INCORRECT' }));
        }
      } else {
        throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      const sessionData = {
        user: data[0]._id,
        deviceType: user.deviceType,
        deviceToken: user.deviceToken || null,
        remoteIP: user.ip,
      };
      const token = await services.UserService.sessionManager(user.deviceType, sessionData, data[0], user.role);
      const criteriaHeader = {
        email: user.email,
      };
      let updateOptions;
      let dataToSet;
      if (headers.utcoffset !== data[0].utcoffset) {
        dataToSet = {
          utcoffset: headers.utcoffset,
          rememberMe: user.rememberMe,
        };
        updateOptions = {
          new: true,
        };
      } else {
        dataToSet = {
          rememberMe: user.rememberMe,
        };
        updateOptions = {
          new: true,
        };
      }
      services.MongoService.updateData('User', criteriaHeader, dataToSet, updateOptions);
      // Remove password before sending
      const cleanResult = JSON.parse(JSON.stringify(data[0]));
      cleanResult.token = token;
      delete cleanResult.password;

      cleanResult.contacts.forEach((x) => {
        delete x.mobileOTP;
        delete x.otpUpdatedAt;
      });
      const controllers = server.plugins['core-controller'];
      if (user.deviceType === configs.UserConfiguration.get('/deviceTypes', { type: 'web' })) {
        const permissions = await controllers.AclController.getRoleWisePermission(user.role);
        cleanResult.permissions = permissions;
      }
      if (user.email) {
        winstonLogger.info('User logged in, Role: ', user.role, ' with email: ', user.email, ' from ip: ', user.ip);
      } else if (user.primaryMobile) {
        winstonLogger.info('User logged in, Role: ', user.role, ' with mobile: ', user.primaryMobile, ' from ip: ', user.ip);
      }

      return universalFunctions.sendSuccess(headers, cleanResult);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  async function uploadImage(headers, fileData) {
    try {
      if (fileData.image && fileData.image.filename) {
        const imageURL = await services.S3Bucket.uploadFileToS3WithThumbnail(fileData.image);
        return universalFunctions.sendSuccess(headers, imageURL);
      }
      throw Boom.badData(configs.MessageConfiguration.get('/lang', { locale: headers['content-language'], message: 'INVALID_FILE_DATA' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
  * @function <b>checkIdentity</b><br>Method For Unified Login of Entities via accessToken
  * @param {Object} user Object Containing Login User Details
  * @param {function} callback
  */
  async function accessTokenLogin(headers, payloadData, userID, role, remoteIP) {
    try {
      const criteria = {
        _id: userID,
      };
      const data = await services.UserService.getUserDetails(criteria, {}, { limit: 1 });
      // Remove password before sending
      if (data.length < 1) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      const cleanResult = JSON.parse(JSON.stringify(data[0]));

      let token = headers.authorization.split(' ');
      token = token[1] ? token[1] : null;
      cleanResult.token = token;

      delete cleanResult.password;
      delete cleanResult.emailVerificationToken;
      delete cleanResult.emailVerificationTokenUpdatedAt;
      cleanResult.contacts.forEach((x) => {
        delete x.mobileOTP;
        delete x.otpUpdatedAt;
      });
      const controllers = server.plugins['core-controller'];
      if (payloadData.deviceType === configs.UserConfiguration.get('/deviceTypes', { type: 'web' })) {
        const permissions = await controllers.AclController.getRoleWisePermission(role);
        cleanResult.permissions = permissions;
      }
      if (data.email) {
        winstonLogger.info('User logged in, Role: ', role, ' with email: ', data.email, ' from ip: ', remoteIP);
      } else if (data.mobile) {
        winstonLogger.info('User logged in, Role: ', role, ' with mobile: ', data.mobile, ' from ip: ', remoteIP);
      }
      return universalFunctions.sendSuccess(headers, cleanResult);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
  * @function <b>changePassword</b> <br> Method For Changing Password of User account
  * @param {Object} queryData  Object containing password details
  * @param {Object} userData   User Credential Object
  * @param {function} callback
  */
  async function changePassword(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      if (!payloadData.oldPassword || !payloadData.newPassword || !userData) {
        throw Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NO_DATA' }));
      } else {
        const isCorrect = await bcrypt.compare(payloadData.oldPassword, userData.password);
        if (isCorrect) {
          const criteria = {
            _id: userData._id,
          };
          const password = universalFunctions.hashPasswordUsingBcrypt(payloadData.newPassword);
          const setQuery = {
            password,
          };
          const options = {
            lean: true,
          };
          const data = await services.MongoService.updateData('User', criteria, setQuery, options);
          if (data) {
            const passwordChanged = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'PASSWORD_CHANGE_SUCCESS' });
            winstonLogger.warn(`Password changed for userID ${userData._id}`);
            // expire all active session for user
            await services.UserService.expireAllActiveSessions(headers, userData._id);
            return universalFunctions.sendSuccess(headers, passwordChanged);
          }
          throw configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NO_DATA' });
        } else {
          winstonLogger.warn(`Password change attempt for userID ${userData._id}`);
          throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INCORRECT_OLD_PASSWORD' }));
        }
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>getResetPasswordToken</b><br>Method For getting Password Reset Token
   * @param {String} email  Email Id of User
   * @param {String} role   Role Of User
   * @param {function} callback
   */
  async function getResetPasswordToken(headers, email) {
    try {
      const lang = headers['content-language'];
      let generatedString = universalFunctions.generateRandomString();
      generatedString = universalFunctions.hashPasswordUsingBcrypt(generatedString);
      const criteria = {
        email,
      };
      const setQuery = {
        passwordResetToken: generatedString,
      };
      const options = {
        new: true,
      };
      const data = await services.MongoService.updateData('User', criteria, setQuery, options);
      if (data) {
        const variableDetails = {
          user_name: `${data.name} ${data.lastName}`,
          password_reset_link: `${configs.UserConfiguration.get('/resetPasswordUrl', { env: process.env.NODE_ENV })}/?lang=${lang}&passwordResetToken=${generatedString}`,
        };
        services.Notification.sendEmailToUser('FORGOT_PASSWORD', variableDetails, data.email, lang);
        const response = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RESET_PASSWORD_LINK' });
        winstonLogger.warn(`Reset password token generated for ${email}`);
        return universalFunctions.sendSuccess(headers, response);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>getforgotPasswordOTP</b><br>Method For getting forgot password OTP
   */
  async function forgotPasswordOTP(headers, queryData) {
    try {
      const mobile = queryData.mobile;
      const countryCode = queryData.countryCode;
      const lang = headers['content-language'];

      const criteria = {
        mobile,
        countryCode,
      };
      let mobileUniqueCode = rand();
      if (process.env.NODE_ENV !== 'production') {
        mobileUniqueCode = 1111;
      }
      const setQuery = {
        forgotPasswordMobileOTP: mobileUniqueCode,
      };
      const options = {
        new: true,
      };
      const data = await services.MongoService.updateData('User', criteria, setQuery, options);
      if (data) {
        const response = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RESEND_OTP' });

        winstonLogger.warn(`Reset password OTP generated for mobile ${mobile}`);
        mobileOTPData = {
          otpCode: data.forgotPasswordMobileOTP,
          user_name: data.name,
        };
        services.Notification.sendSMSToUser(mobileOTPData, countryCode, mobile, lang);
        return universalFunctions.sendSuccess(headers, response);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>getResetPasswordTokenWithOTP</b><br>Method For getting Password Reset Token
   */
  async function getResetPasswordTokenWithOTP(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      let generatedString = universalFunctions.generateRandomString();
      generatedString = universalFunctions.hashPasswordUsingBcrypt(generatedString);
      const criteria = {
        countryCode: payloadData.countryCode,
        mobile: payloadData.mobile,
      };
      let data = await services.MongoService.getFirstMatch('User', criteria, { forgotPasswordMobileOTP: 1 }, { lean: true });
      if (!data) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      if (data.forgotPasswordMobileOTP === payloadData.OTP) {
        const setQuery = {
          $unset: {
            forgotPasswordMobileOTP: 1,
          },
          passwordResetToken: generatedString,
        };
        const options = {
          new: true,
        };
        data = await services.MongoService.updateData('User', criteria, setQuery, options);
        if (data) {
          const variableDetails = {
            user_name: `${data.name} ${data.lastName}`,
            passwordResetToken: generatedString,
          };
          winstonLogger.warn(`Reset password token generated for mobile ${payloadData.mobile}`);
          return universalFunctions.sendSuccess(headers, variableDetails);
        }
      } else {
        throw Boom.resourceGone(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'OTP_EXPIRED' }));
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
  * @function <b>resetPassword</b>  <br>Method to Reset User Password Via Email Link
  * @param {Object} payloadData  Object containing reset password details
  */
  async function resetPassword(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        passwordResetToken: payloadData.passwordResetToken,
      };
      const newPassword = universalFunctions.hashPasswordUsingBcrypt(payloadData.newPassword);
      const updateData = {
        password: newPassword,
        passwordResetToken: null,
      };
      const options = {
        new: true,
      };
      const passwordUpdate = await services.MongoService.updateData('User', criteria, updateData, options);
      if (passwordUpdate) {
        const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UPDATED' });
        winstonLogger.warn(`Password updated for ${passwordUpdate.email}`);
        await services.UserService.expireAllActiveSessions(headers, passwordUpdate._id);
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.unauthorized(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INVALID_RESET_PASSWORD_TOKEN' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
     *
     * @function <b>setPassword</b> <br>This is a function for adding password when register via admin
     *
     * @param {Object} userData data containing user token
     */
  async function setPassword(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const projection = {
        linkExpiresIn: 1,
        _id: 0,
      };
      const emailExpireTime = await services.MongoService.getDataAsync('AdminSetting', {}, projection, {});
      const date = new Date();
      let expirationTime = new Date();
      if (emailExpireTime[0]) {
        expirationTime = new Date(date.getTime() - (emailExpireTime[0].linkExpiresIn * 1000));
      }
      const criteria = {
        emailVerificationToken: payloadData.emailVerificationToken,
        isAdminVerified: true,
        emailVerificationTokenUpdatedAt: {
          $gt: expirationTime,
        },
      };
      const setQuery = {
        $set: {
          isEmailVerified: true,
          password: universalFunctions.hashPasswordUsingBcrypt(payloadData.password),
        },
        $unset: {
          emailVerificationToken: 1,
          emailVerificationTokenUpdatedAt: 1,
        },
      };
      const options = {
        new: true,
        lean: true,
      };
      const emailVerified = await services.MongoService.updateData('User', criteria, setQuery, options);
      if (emailVerified) {
        winstonLogger.warn(`User verified for email ${emailVerified.email}`);
        const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'PASSWORD_ADD_SUCCESS' });
        await services.UserService.expireAllActiveSessions(headers, emailVerified._id);
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.resourceGone(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'LINK_EXPIRED' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
     * @function <b>emailVerify</b> <br>  Method For Verifying email link
     * @param {object} queryData  queryObject containing request data
    */

  async function emailVerify(headers, queryData) {
    lang = headers['content-language'];
    try {
      const projection = {
        linkExpiresIn: 1,
        _id: 0,
      };
      const emailExpireTime = await services.MongoService.getDataAsync('AdminSetting', {}, projection, {});
      const date = new Date();
      let expirationTime = new Date();
      if (emailExpireTime[0]) {
        expirationTime = new Date(date.getTime() - (emailExpireTime[0].linkExpiresIn * 1000));
      }
      const criteria = {
        emailVerificationToken: queryData.emailVerificationToken,
        emailVerificationTokenUpdatedAt: {
          $gt: expirationTime,
        },
      };
      const setQuery = {
        $set: {
          isEmailVerified: true,
        },
        $unset: {
          emailVerificationToken: 1,
          emailVerificationTokenUpdatedAt: 1,
        },
      };
      const options = {
        new: true,
        lean: true,
      };
      const emailVerified = await services.MongoService.updateData('User', criteria, setQuery, options);
      if (emailVerified) {
        const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'EMAIL_VERIFICATION_SUCCESS' });
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.resourceGone(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'LINK_EXPIRED' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
    *
    * @function <b>sendOTP</b> <br>This is a function for sending otp on mobile
    * @param {Object} userData data containing user email
    */
  async function sendOTP(userData, contacts, lang) {
    /*
     Create a Unique 4 digit code
     Insert It Into  DB
     Send the 4 digit code via SMS
     Send Back Response
     */
    try {
      const phoneNo = contacts.mobile;
      const countryCode = contacts.countryCode;
      let mobileUniqueCode = rand();
      if (process.env.NODE_ENV !== 'production') {
        mobileUniqueCode = 1111;
      }
      const criteria = {
        _id: userData._id,
        'contacts.mobile': contacts.mobile,
      };
      setQuery = {
        $set: {
          'contacts.$.mobileOTP': mobileUniqueCode,
          'contacts.$.otpUpdatedAt': new Date(),
        },
      };
      const options = {
        lean: true,
        new: true,
      };
      services.MongoService.updateData('User', criteria, setQuery, options);
      mobileOTPData = {
        otpCode: mobileUniqueCode,
        user_name: userData.name,
      };
      services.Notification.sendSMSToUser(mobileOTPData, countryCode, phoneNo, lang);
      return mobileUniqueCode;
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }
  /**
  * @function <b>verifyAndResendOTP</b> verify user and send otp
  * @param {object} sessionToken
  */
  async function verifyAndResendOTP(headers, payloadData, sessionData) {
    lang = headers['content-language'];
    try {
      const criteria = {
        _id: sessionData.userID,
      };
      const data = await services.UserService.getUserDetails(criteria, {}, { limit: 1 });
      if (data.length > 0) {
        let userContact;
        for (let i = 0; i < data[0].contacts.length; i += 1) {
          if (data[0].contacts[i].mobile === payloadData.mobile) {
            userContact = data[0].contacts[i];
          }
        }
        if (userContact) {
          if (userContact.isVerified) {
            throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'ALREADY_VERIFIED' }));
          }
          await sendOTP(data[0], userContact, lang);
          const responseData = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RESEND_OTP' });
          return universalFunctions.sendSuccess(headers, responseData);
        }
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'WRONG_MOBILE' }));
      } else {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
  * @function <b> resend email</b> resend email
  * @param {object} sessionToken
  */
  /**
    *
    * @function <b>sendOTP</b> <br>This is a function for sending otp on mobile
    * @param {Object} userData data containing user email
    */
  async function sendEmail(userData, headers) {
    const lang = headers['content-language'];
    try {
      const emailToken = universalFunctions.hashPasswordUsingBcrypt(shortid.generate());
      const criteria = {
        _id: userData._id,
      };
      setQuery = {
        $set: {
          emailVerificationToken: emailToken,
          emailVerificationTokenUpdatedAt: new Date(),
        },
      };
      const options = {
        lean: true,
        new: true,
      };
      services.MongoService.updateData('User', criteria, setQuery, options);
      const adminUrl = `${configs.UserConfiguration.get('/adminUrl', {
        env: process.env.NODE_ENV,
      })}?lang=${lang}&emailVerificationToken=${emailToken}`;
      const emailUrl = `${configs.UserConfiguration.get('/emailVerifyUrl', {
        env: process.env.NODE_ENV,
      })}?lang=${lang}&emailVerificationToken=${emailToken}`;
      data = {
        emailVerificationToken: emailToken,
        user_name: userData.name,
        user_email: userData.email,
        deleteRoute: `${configs.AppConfiguration.config.SERVER.DOMIAN_FRONT_END_URL}/user/deleteUser/${userData.email}`,
        verification_url: userData.isAdminVerified ? adminUrl : emailUrl,
      };
      const emailData = {
        emailType: userData.isAdminVerified ? 'LOGIN_CREDENTIALS' : 'REGISTRATION_MAIL',
        data,
        emailID: userData.email,
      };
      const notifyUser = {
        sendEmailToUser: true,
      };
      services.Notification.sendNotification(notifyUser, null, null, emailData, lang);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function resendEmail(headers, sessionData) {
    const lang = headers['content-language'];
    try {
      const criteria = {
        _id: sessionData.userID,
      };
      const projection = {
        name: 1,
        email: 1,
        isEmailVerified: 1,
        isAdminVerified: 1,
      };
      const data = await services.MongoService.getFirstMatch('User', criteria, projection, { limit: 1 });
      if (data) {
        if (data.isVerified) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'ALREADY_VERIFIED' }));
        }
        // send email
        sendEmail(data, headers);
        const responseData = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RESEND_EMAIL' });
        return universalFunctions.sendSuccess(headers, responseData);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function addPhoneNumber(headers, payloadData, userData) {
    const lang = headers['content-language'];
    try {
      for (let i = 0; i < userData.contacts.length; i += 1) {
        if (userData.contacts[i].mobile === payloadData.mobile) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SAME_NUMBER' }));
        }
      }
      const criteria = {
        _id: userData._id,
      };
      const dataToSet = {
        $push: {
          contacts: {
            mobile: payloadData.mobile,
            countryCode: payloadData.countryCode,
            isPrimary: payloadData.isPrimary,
          },
        },
      };
      const options = {
        new: true,
        lean: true,
      };
      const data = await services.MongoService.updateData('User', criteria, dataToSet, options);
      const userContact = {
        mobile: payloadData.mobile,
        countryCode: payloadData.countryCode,
      };
      await sendOTP(data, userContact, lang);
      const responseData = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RESEND_OTP' });
      return universalFunctions.sendSuccess(headers, responseData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function setPrimaryNumber(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      let userContact;
      let currentPrimaryMobile;
      for (let i = 0; i < userData.contacts.length; i += 1) {
        if (userData.contacts[i].mobile === payloadData.mobile) {
          userContact = userData.contacts[i];
        }
        if ((userData.contacts[i].mobile !== payloadData.mobile) && userData.contacts[i].isPrimary) {
          currentPrimaryMobile = userData.contacts[i];
        }
      }
      if (!userContact) {
        throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'MOBILE_NOT_FOUND' }));
      }
      if (userContact.isPrimary) {
        throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'PRIMARY_MOBILE' }));
      }
      const newPrimary = {
        _id: userData._id,
        contacts: {
          $elemMatch: {
            mobile: payloadData.mobile,
          },
        },
      };
      const setPrimary = {
        mobile: payloadData.mobile,
        countryCode: payloadData.countryCode,
        'contacts.$.isPrimary': true,
      };
      const options = {
        new: true,
      };

      const oldPrimary = {
        _id: userData._id,
        contacts: {
          $elemMatch: {
            mobile: currentPrimaryMobile.mobile,
          },
        },
      };
      const unsetPrimary = {
        'contacts.$.isPrimary': false,
      };
      const promise = Promise.all([
        services.MongoService.updateData('User', newPrimary, setPrimary, options),
        services.MongoService.updateData('User', oldPrimary, unsetPrimary, options),
      ]);
      await promise;
      const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UPDATED' });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function updateUTCoffset(headers, userData) {
    try {
      lang = headers['content-language'];
      const criteria = {
        _id: userData._id,
      };
      const dataToSet = {
        utcoffset: headers.utcoffset,
      };
      const options = {
        new: true,
      };
      await services.MongoService.updateData('User', criteria, dataToSet, options);
      const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UPDATED' });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function updateDeviceToken(headers, payloadData, userData) {
    try {
      lang = headers['content-language'];
      const role = payloadData.role;
      const dataToSet = {
        $set: {
          deviceToken: payloadData.deviceToken,
        },
      };
      const options = {
        new: true,
      };
      const sessionCriteria = {
        user: userData._id,
      };
      let criteria;
      let promise;
      if (role === configs.UserConfiguration.get('/roles', { role: 'customer' })) {
        criteria = {
          _id: userData.customerID,
        };
        promise = services.MongoService.updateData('Customer', criteria, dataToSet, options);
      } else if (role === configs.UserConfiguration.get('/roles', { role: 'driver' })) {
        criteria = {
          _id: userData.driverID,
        };
        promise = services.MongoService.updateData('Driver', criteria, dataToSet, options);
      } else if (role === configs.UserConfiguration.get('/roles', { role: 'serviceProvider' })) {
        criteria = {
          _id: userData.serviceProviderID,
        };
        promise = services.MongoService.updateData('ServiceProvider', criteria, dataToSet, options);
      }
      await services.MongoService.updateData('Session', sessionCriteria, dataToSet, options);
      const promiseData = await promise;
      return universalFunctions.sendSuccess(headers, promiseData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
    * @function <b>checkAndVerifyOTP</b> verify OTP of user
    * @param {object} queryData
    * @param {object} sessionToken
    * @param {function} callback
    */
  async function checkAndVerifyOTP(headers, payloadData, sessionData) {
    try {
      lang = headers['content-language'];
      const projection = {
        otpExpiresIn: 1,
        _id: 0,
      };
      const otpExpireTime = await services.MongoService.getDataAsync('AdminSetting', {}, projection, {});
      const date = new Date();
      let expirationTime = new Date();
      if (otpExpireTime[0]) {
        expirationTime = new Date(date.getTime() - (otpExpireTime[0].otpExpiresIn * 1000));
      }
      const criteria = {
        _id: sessionData.userID,
        contacts: {
          $elemMatch: {
            mobile: payloadData.mobile,
            mobileOTP: payloadData.OTPCode,
            otpUpdatedAt: {
              $gt: expirationTime,
            },
          },
        },
      };
      const setQuery = {
        isPhoneVerified: true,
        'contacts.$.isVerified': true,
        $unset: {
          'contacts.$.mobileOTP': 1,
          'contacts.$.otpUpdatedAt': 1,
        },
      };
      const options = {
        lean: true,
        new: true,
      };
      const verifyOTP = await services.MongoService.updateData('User', criteria, setQuery, options);
      if (verifyOTP) {
        const data = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'MOBILE_VERIFICATION_SUCCESS' });
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.resourceGone(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'OTP_EXPIRED' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>deleteUser</b> hard delete user
   * @param {object} queryData user email of the user to be deleted
   * @param {function} callback
   */
  async function deleteUser(headers, paramsData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        email: paramsData.email,
        isEmailVerified: false,
      };
      const userData = await services.UserService.getUserDetails(criteria, {}, { limit: 1 });
      if (userData.length > 0) {
        if (userData[0].customerID) {
          const customerCriteria = {
            _id: userData[0].customerID,
          };
          const addressCriteria = {
            _id: userData[0].customerAddressID,
          };
          services.MongoService.deleteData('Customer', customerCriteria);
          services.MongoService.deleteData('Address', addressCriteria);
        }

        if (userData[0].driverID) {
          const driverCriteria = {
            _id: userData[0].driverID,
          };
          const addressCriteria = {
            _id: userData[0].driverAddressID,
          };
          services.MongoService.deleteData('Driver', driverCriteria);
          services.MongoService.deleteData('Address', addressCriteria);
        }

        if (userData[0].serviceProviderID) {
          const serviceProviderCriteria = {
            _id: userData[0].serviceProviderID,
          };
          const addressCriteria = {
            _id: userData[0].serviceProviderAddressID,
          };
          services.MongoService.deleteData('ServiceProvider', serviceProviderCriteria);
          services.MongoService.deleteData('Address', addressCriteria);
        }
        await services.MongoService.deleteData('User', criteria);
        const response = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_DELETED' });
        return universalFunctions.sendSuccess(headers, response);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  // /**
  //  * @function <b>phoneCheck</b> pre check of user prior to user registration have unique contact number with emailVerified
  //  * @param {object} contact contact number of the user
  //  * @param {function} callback
  //  */
  async function phoneCheck(contact, lang) {
    const criteria = {
      contacts: {
        $elemMatch: {
          mobile: contact.mobile,
        },
      },
      _id: {
        $ne: contact.userID,
      },
    };
    const data = await services.MongoService.countData('User', criteria);
    if (data > 0) {
      throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CONTACT_IN_USE' }));
    }
  }

  async function updatePhoneNumber(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      let userContact;
      for (let i = 0; i < userData.contacts.length; i += 1) {
        if (userData.contacts[i].mobile === payloadData.oldMobile) {
          userContact = userData.contacts[i];
        }
      }
      if (!userContact) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'WRONG_MOBILE' }));
      }
      if (userContact.isPrimary) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'PRIMARY_CANNOT_UPDATE' }));
      }
      const newPhone = {
        countrycode: payloadData.countryCode,
        mobile: payloadData.newMobile,
      };
      await phoneCheck(newPhone, lang);
      const criteria = {
        _id: userData._id,
        contacts: {
          $elemMatch: {
            mobile: payloadData.oldMobile,
          },
        },
      };
      const dataToSet = {
        'contacts.$.mobile': payloadData.newMobile,
        'contacts.$.countryCode': payloadData.countryCode,
        'contacts.$.isVerified': false,
      };
      const options = {
        new: true,
      };
      const contact = {
        mobile: payloadData.newMobile,
        countryCode: payloadData.countryCode,
        userID: userData._id,
      };
      await services.MongoService.updateData('User', criteria, dataToSet, options);
      await sendOTP(userData, contact, lang);
      const responseData = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'RESEND_OTP' });
      return universalFunctions.sendSuccess(headers, responseData);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function deletePhoneNumber(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      let userContact;
      for (let i = 0; i < userData.contacts.length; i += 1) {
        if (userData.contacts[i].mobile === payloadData.mobile) {
          userContact = userData.contacts[i];
        }
      }
      if (!userContact) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'WRONG_MOBILE' }));
      }
      if (userContact && userContact.isPrimary) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'DELETING_PRIMARY_NUMBER' }));
      }
      const criteria = {
        _id: userData._id,
      };
      const dataToSet = {
        $pull: {
          contacts: {
            mobile: payloadData.mobile,
          },
        },
      };
      const options = {
        new: true,
      };
      await services.MongoService.updateData('User', criteria, dataToSet, options);
      const response = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UPDATED' });
      return universalFunctions.sendSuccess(headers, response);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function contactUs(headers, payloadData) {
    try {
      const variableDetails = {
        user_name: payloadData.name,
        query: payloadData.query,
      };
      const from = payloadData.email;
      // todo admin default settings
      const projection = {
        contactUsEmail: 1,
        _id: 0,
      };
      const contactEmail = await services.MongoService.getDataAsync('AdminSetting', {}, projection, {});

      const to = contactEmail[0].contactUsEmail || 'mukeshsharma1426@gmail.com';
      await services.Notification.sendEmailQueryToAdmin('QUERY', variableDetails, from, to);
      const response = configs.MessageConfiguration.get('/lang', { locale: lang, message: 'MESSAGE_SENT' });
      return universalFunctions.sendSuccess(headers, response);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
    * @function <b>userLogout</b> Method for deleting Session Of User
    * @param {object} userData  credentials Of User to be logged out
    * @param {*} callback   callback Function
    */
  async function userLogout(headers, sessionData, remoteIP) {
    const data = await services.UserService.expireSession(headers, sessionData);
    winstonLogger.info('User logged out, Role: ', sessionData.role, ' with userID: ', sessionData.userID, ' from ip: ', remoteIP);
    return universalFunctions.sendSuccess(headers, data);
  }

  async function exsitingUserCheck(userData, lang) {
    try {
      const referralCode = userData.referralCode;
      if (referralCode) {
        const refProjection = {
          noOfReferrals: 1,
          noOfReferralsUsed: 1,
        };
        const referralData = await services.MongoService.getFirstMatch('ReferralUsage', { referralCode }, refProjection, { lean: true });
        if (!referralData || (referralData.noOfReferralsUsed >= referralData.noOfReferrals)) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INVALID_REFERRAL' }));
        }
      }
      const criteria = {
        $or: [{
          email: userData.email,
        },
        {
          contacts: {
            $elemMatch: {
              mobile: userData.mobile,
              // isVerified: true,
            },
          },
        },
        {
          userName: userData.userName,
        },
        ],
      };
      const projection = {
        email: 1,
        contacts: 1,
        userName: 1,
        isDeleted: 1,
        isBlocked: 1,
      };
      const options = {
        limit: 1,
        lean: true,
      };
      const data = await services.MongoService.getFirstMatch('User', criteria, projection, options);
      if (data) {
        if (data.isDeleted) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'ACCOUNT_DEACTIVATED' }));
        } else if (data.isBlocked) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'EMAIL_BLOCKED' }));
        } else if (data.email === userData.email) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'EMAIL_IN_USE' }));
        } else if (data.userName === userData.userName) {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USERNAME_IN_USE' }));
        } else {
          throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CONTACT_IN_USE' }));
        }
      } else {
        return true;
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function sendVerificationNotification(userData, contacts, lang) {
    try {
      const phoneNo = contacts.mobile;
      const countryCode = contacts.countryCode;
      let mobileUniqueCode = rand();
      if (process.env.NODE_ENV !== 'production') {
        mobileUniqueCode = 1111;
      }
      const emailToken = universalFunctions.hashPasswordUsingBcrypt(shortid.generate());
      const notifyUser = {
        sendSMSToUser: true,
        sendEmailToUser: true,
        sendPushToUser: false,
      };
      if (!userData.email) {
        notifyUser.sendEmailToUser = false;
      }
      const pushData = {};
      const criteria = {
        _id: userData._id,
        'contacts.mobile': contacts.mobile,
      };
      setQuery = {
        $set: {
          'contacts.$.mobileOTP': mobileUniqueCode,
          'contacts.$.otpUpdatedAt': new Date(),
          emailVerificationToken: emailToken,
          emailVerificationTokenUpdatedAt: new Date(),
        },
      };
      const options = {
        lean: true,
        new: true,
      };
      services.MongoService.updateData('User', criteria, setQuery, options);
      if (notifyUser.sendSMSToUser) {
        mobileOTPData = {
          otpCode: mobileUniqueCode,
          user_name: userData.name,
        };
        smsData = {
          data: mobileOTPData,
          countryCode,
          phoneNo,
        };
      }

      if (notifyUser.sendEmailToUser) {
        const adminUrl = `${configs.UserConfiguration.get('/adminUrl', {
          env: process.env.NODE_ENV,
        })}?lang=${lang}&emailVerificationToken=${emailToken}`;
        const emailUrl = `${configs.UserConfiguration.get('/emailVerifyUrl', {
          env: process.env.NODE_ENV,
        })}?lang=${lang}&emailVerificationToken=${emailToken}`;
        data = {
          emailVerificationToken: emailToken,
          user_name: userData.name,
          user_email: userData.email,
          deleteRoute: `${configs.AppConfiguration.config.SERVER.DOMIAN_FRONT_END_URL}/user/deleteUser/${userData.email}`,
          verification_url: userData.isAdminVerified ? adminUrl : emailUrl,
        };
        emailData = {
          emailType: userData.isAdminVerified ? 'LOGIN_CREDENTIALS' : 'REGISTRATION_MAIL',
          data,
          emailID: userData.email,
        };
      }
      services.Notification.sendNotification(notifyUser, smsData, pushData, emailData, lang);
      return mobileUniqueCode;
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function getUserWalllet(headers, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        user: userData._id,
      };
      const data = await services.MongoService.getFirstMatch('UserWallet', criteria, { _id: 0, referralPattern: 0 }, { lean: true });
      if (!data) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'WALLET_NOT_FOUND' }));
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }
  async function getReferralCode(headers, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        user: userData._id,
      };
      const data = await services.MongoService.getFirstMatch('ReferralUsage', criteria, { _id: 0, referralPattern: 0 }, { lean: true });
      if (!data) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_NOT_FOUND' }));
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  return {
    controllerName: 'UserController',
    login,
    uploadImage,
    accessTokenLogin,
    changePassword,
    getResetPasswordToken,
    forgotPasswordOTP,
    getResetPasswordTokenWithOTP,
    resetPassword,
    setPassword,
    emailVerify,
    verifyAndResendOTP,
    sendOTP,
    sendEmail,
    resendEmail,
    addPhoneNumber,
    setPrimaryNumber,
    updateUTCoffset,
    updateDeviceToken,
    checkAndVerifyOTP,
    deleteUser,
    updatePhoneNumber,
    deletePhoneNumber,
    contactUs,
    userLogout,
    exsitingUserCheck,
    phoneCheck,
    sendVerificationNotification,
    getUserWalllet,
    getReferralCode,
  };
};
