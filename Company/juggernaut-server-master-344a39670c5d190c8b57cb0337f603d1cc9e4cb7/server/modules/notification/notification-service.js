const apns = require('apn');
const Path = require('path');
const Boom = require('boom');
const fsExtra = P.promisifyAll(require('fs-extra'));
const nodeMailerModule = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const twilio = require('twilio');
const Fcm = require('fcm');
const Handlebars = require('handlebars');
const VoiceResponse = require('twilio').twiml.VoiceResponse;

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const twilioCredentials = configs.NotificationConfig.get('/twilioCredentials', { env: process.env.NODE_ENV });
  const client = twilio(twilioCredentials.accountSid, twilioCredentials.authToken);
  const emailCredentials = configs.NotificationConfig.get('/nodeMailer/Mandrill', { env: process.env.NODE_ENV });
  const transporter = nodeMailerModule.createTransport(smtpTransport(emailCredentials));

  async function deleteFile(path) {
    return fsExtra.removeAsync(path);
  }

  /*
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @ sendMailViaTransporter Function
  @ This function will initiate sending email as per the mailOptions are set
  @ Requires following parameters in mailOptions
  @ createfrom:  // sender address
  @ to:  // list of receivers
  @ subject:  // Subject line
  @ html: html body
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  */
  async function sendMailViaTransporter(mailOptions) {
    try {
      transporter.sendMail(mailOptions);
      if (mailOptions.attachments) {
        deleteFile(mailOptions.attachments.path);
      }
      return true;
    } catch (error) {
      winstonLogger.warn(error);
    }
  }

  function renderMessageFromTemplateAndVariables(templateData, variablesData) {
    return Handlebars.compile(templateData)(variablesData);
  }

  /*
     ==========================================================
     Send the notification to the iOS device for customer
     ==========================================================
     */
  function sendIosPushNotification(iosDeviceToken, messageData, messageToDisplay, notificationType, userType) {
    let certificate = null;
    let gateway = null;
    messageData.statusUpdates = [];
    if (messageData.driver && messageData.driver.deviceToken) {
      messageData.driver.deviceToken = '';
    }
    if (messageData.customer && messageData.customer.deviceToken) {
      messageData.customer.deviceToken = '';
    }
    if (userType === configs.UserConfiguration.get('/roles', { role: 'customer' })) {
      certificate = Path.resolve('.') + configs.NotificationConfig.get('/iOSPushSettings/customer', { env: process.env.NODE_ENV }).iosApnCertificate;
      gateway = configs.NotificationConfig.get('/iOSPushSettings/customer', { env: process.env.NODE_ENV }).gateway;
    } else {
      certificate = Path.resolve('.') + configs.NotificationConfig.get('/iOSPushSettings/driver/iosApnCertificate');
      gateway = configs.NotificationConfig.get('/iOSPushSettings/driver/gateway');
    }
    const status = 1;
    let bookingID;
    let msg = messageToDisplay;
    if (messageData.notificationMessage) {
      msg = messageData.notificationMessage;
      delete messageData.notificationMessage;
    }
    if (messageData.bookingID) {
      bookingID = messageData.bookingID;
      delete messageData.bookingID;
    }

    const alertMsg = msg;
    const snd = 'ping.aiff';
    // if (flag == 4 || flag == 6) {
    //    status = 0;
    //    msg = '';
    //    snd = '';
    // }

    const options = {
      cert: certificate,
      certData: null,
      key: certificate,
      keyData: null,
      passphrase: 'click',
      ca: null,
      pfx: null,
      pfxData: null,
      gateway,
      port: 2195,
      rejectUnauthorized: true,
      enhanced: true,
      autoAdjustCache: true,
      connectionTimeout: 0,
      ssl: true,
      debug: true,
      //  production : true
    };

    function log(type) { // eslint-disable-line no-unused-vars
      return function () { };
    }
    if (iosDeviceToken) {
      const tokenData = iosDeviceToken;
      try {
        const deviceToken = new apns.Device(tokenData);
        const apnsConnection = new apns.Connection(options);
        const note = new apns.Notification();

        note.expiry = Math.floor(Date.now() / 1000) + 3600;
        note.contentAvailable = 1;
        note.sound = snd;
        note.alert = alertMsg;
        note.newsstandAvailable = status;
        note.payload = {
          messageToDisplay,
          data: bookingID,
          notificationType,
        };

        apnsConnection.pushNotification(note, deviceToken);

        // Handle these events to confirm that the notification gets
        // transmitted to the APN server or find error if any
        apnsConnection.on('transmissionError', (errCode, notification, device) => {
          console.error(`Notification caused error: ${errCode} for device `, device.token.toString('hex'), notification); // eslint-disable-line no-console
        });

        apnsConnection.on('error', log('error'));
        apnsConnection.on('transmitted', log('transmitted'));
        apnsConnection.on('timeout', log('timeout'));
        apnsConnection.on('connected', log('connected'));
        apnsConnection.on('disconnected', log('disconnected'));
        apnsConnection.on('socketError', log('socketError'));
        apnsConnection.on('transmissionError', log('transmissionError'));
        apnsConnection.on('cacheTooSmall', log('cacheTooSmall'));
      } catch (error) {
        winstonLogger.warn(error);
      }
    }
  }

  /*
   ==============================================
   Send the notification to the android device
   =============================================
   */
  function sendAndroidPushNotification(deviceToken, messageData, messageToDisplay, notificationType, userType) { // eslint-disable-line no-unused-vars
    const FCM = Fcm.FCM;

    const fcm = new FCM(configs.NotificationConfig.get('/androidPushSettings/customer/fcmSender'));
    const message = {
      registrationID: deviceToken, // required
      collapse_key: 'demo',
      'data.messageToDisplay': messageData.notificationMessage,
      'data.info': messageData.toString(),
      'data.notificationType': notificationType,

    };

    fcm.send(message, (err, messageID) => { // eslint-disable-line no-unused-vars
      if (err) {
        winstonLogger.warn(error);
        return 1;
      }
      return 0;
    });
  }

  /*
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   @ sendSMS Function
   @ This function will initiate sending sms as per the smsOptions are set
   @ Requires following parameters in smsOptions
   @ from:  // sender address
   @ to:  // list of receivers
   @ Body:  // SMS text message
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
   */
  function sendSMS(smsOptions) {
    client.messages.create(smsOptions);
    return 0;
  }

  /**
   * @function <b>sendSMSToUser</b><br>Notification Plugin method to Send OTP
   * @param {Object} otpData  object containing otp details
   * @param {String} countryCode  country code of mobile
   * @param {String} phoneNo user Phone number
   * @param {function} externalCB
   */
  async function sendSMSToUser(smsData, countryCode, phoneNo, lang) {
    const templateData = configs.NotificationConfig.get('/notificationMessages/verificationCodeMsg', { lang });

    const smsOptions = {
      from: configs.NotificationConfig.get('/twilioCredentials/smsFromNumber'),
      to: countryCode + phoneNo.toString(),
      body: null,
    };
    smsOptions.body = await renderMessageFromTemplateAndVariables(templateData, smsData);
    sendSMS(smsOptions);
    return 0;
  }

  /**
   * @function <b>sendPUSHToUser</b><br>Method to Send Push Notifications
   * @param {String} deviceToken  user device token
   * @param {String} deviceType   user device type
   * @param {String} userType     Role of user
   * @param {String} dataToSend   body Of push Notification
   * @param {String} notificationType  type of Notification
   * @param {function} callback
   */
  const sendPUSHToUser = function (deviceToken, deviceType, userType, dataToSend, notificationType) {
    // eslint-disable-next-line no-undef
    if (!socketStatus) {
      if (deviceType === configs.NotificationConfig.get('/DEVICE_TYPE/ANDROID') ||
        deviceType === configs.NotificationConfig.get('/DEVICE_TYPE/IOS')) {
        if (deviceType === configs.NotificationConfig.get('/DEVICE_TYPE/ANDROID')) {
          sendAndroidPushNotification(deviceToken, dataToSend, notificationType, notificationType, userType);
        } else if (deviceType === configs.NotificationConfig.get('/DEVICE_TYPE/IOS')) {
          sendIosPushNotification(deviceToken, dataToSend, notificationType, notificationType, userType);
        }
      }
    }
  };

  /**
   * @function <b>sendEmailToUser</b><br> Method to send Email to User
   * @param {String} emailType   type of email
   * @param {Object} emailVariables   options for email
   * @param {String} emailID      User email ID
   * @param {function} callback
   */
  async function sendEmailToUser(emailType, emailVariables, emailID, lang) {
    try {
      const mailOptions = {
        from: `${configs.NotificationConfig.get('/from', { lang })}<care@baseProject.com>`,
        to: emailID,
        subject: null,
        html: null,
      };
      const registrationEmail = configs.NotificationConfig.get('/notificationMessages/registrationEmail/emailMessage', {
        lang,
      });
      const otpEmail = configs.NotificationConfig.get('/notificationMessages/otpEmail/emailMessage');
      const loginCredentialsEmail = configs.NotificationConfig.get('/notificationMessages/loginCredentialsEmail/emailMessage', {
        lang,
      });
      const forgotPasswordEmail = configs.NotificationConfig.get('/notificationMessages/forgotPassword/emailMessage');
      const driverContactFormEmail = configs.NotificationConfig.get('/notificationMessages/contactDriverForm/emailMessage');
      const businessContactFormEmail = configs.NotificationConfig.get('/notificationMessages/contactBusinessForm/emailMessage');
      const queryEmail = configs.NotificationConfig.get('/notificationMessages/query/emailMessage');

      switch (emailType) {
        case 'REGISTRATION_MAIL':
          mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/registrationEmail/emailSubject', {
            lang,
          });
          mailOptions.html = renderMessageFromTemplateAndVariables(registrationEmail, emailVariables);
          break;
        case 'OTP':
          mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/registrationEmail/emailSubject');
          mailOptions.html = renderMessageFromTemplateAndVariables(otpEmail, emailVariables);
          break;
        case 'LOGIN_CREDENTIALS':
          mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/loginCredentialsEmail/emailSubject', {
            lang,
          });
          mailOptions.html = renderMessageFromTemplateAndVariables(loginCredentialsEmail, emailVariables);
          break;
        case 'FORGOT_PASSWORD':
          mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/forgotPassword/emailSubject');
          mailOptions.html = renderMessageFromTemplateAndVariables(forgotPasswordEmail, emailVariables);
          break;
        case 'DRIVER_CONTACT_FORM':
          mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/contactDriverForm/emailSubject');
          mailOptions.html = renderMessageFromTemplateAndVariables(driverContactFormEmail, emailVariables);
          break;
        case 'BUSINESS_CONTACT_FORM':
          mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/contactBusinessForm/emailSubject');
          mailOptions.html = renderMessageFromTemplateAndVariables(businessContactFormEmail, emailVariables);
          break;
        case 'QUERY':
          mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/query/emailSubject');
          mailOptions.html = renderMessageFromTemplateAndVariables(queryEmail, emailVariables);
          break;

        case 'BILL_OF_LADING':
          mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/billOfLading/emailSubject');
          mailOptions.attachments = {
            path: `${__dirname}/../shipment/bill_of_lading/${emailID}.pdf`,
          };
          break;
        default:
          break;
      }
      sendMailViaTransporter(mailOptions);
    } catch (error) {
      winstonLogger.error(error);
    }
  }

  async function sendNotification(options, sms, push, email, lang) {
    if (options.sendSMSToUser) {
      sendSMSToUser(sms.data, sms.countryCode, sms.phoneNo, lang);
    }
    if (options.sendEmailToUser) {
      sendEmailToUser(email.emailType, email.data, email.emailID, lang);
    }
    if (options.sendPUSHToUser) {
      sendPUSHToUser(push.deviceToken, push.deviceType, push.userType, push.dataToSend, push.notificationType);
    }
  }

  async function sendEmailQueryToAdmin(emailType, emailVariables, fromEmail, toEmail) {
    const mailOptions = {
      from: fromEmail,
      // todo email of admin to be updated
      to: toEmail,
      subject: null,
      html: null,
    };
    const queryMessage = configs.NotificationConfig.get('/notificationMessages/query/emailMessage');
    mailOptions.subject = configs.NotificationConfig.get('/notificationMessages/query/emailSubject');
    mailOptions.html = renderMessageFromTemplateAndVariables(queryMessage, emailVariables);
    const emailData = await sendMailViaTransporter(mailOptions);
    if (emailData) {
      return emailData;
    }
    throw Boom.clientTimeout();
  }

  async function voiceCall(toPhoneNumber, fromPhoneNumber, customerSupportNumber) {
    try {
      await client.calls.create({
        url: configs.NotificationConfig.get('/twilioCall/callURL') + fromPhoneNumber,
        to: toPhoneNumber,
        from: fromPhoneNumber
      });
      const twiml = new VoiceResponse();
      /* twiml.dial({callerId: "+" + Number(settingData.twilioNumber)},function(node){ */
      twiml.dial({
        callerId: customerSupportNumber,
        record: true,
      }, (node) => {
        node.number(toPhoneNumber);
      });
      const twimlResponse = twiml.toString();
      return twimlResponse;
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }

    // (err, call) => { // eslint-disable-line no-unused-vars
    //   if (err) {
    //       cb(err);
    //   } else {
    //       const twiml = new twilio.TwimlResponse();
    //       /* twiml.dial({callerId: "+" + Number(settingData.twilioNumber)},function(node){*/
    //       twiml.dial({
    //           callerId: customerSupportNumber,
    //           record: true
    //       }, (node) => {
    //           node.number(toPhoneNumber);
    //       });
    //       const twimlResponse = twiml.toString();
    //       cb(null, twimlResponse);
    //   }
    // }
  }


  return {
    serviceName: 'Notification',
    sendNotification,
    sendSMSToUser,
    sendSMS,
    renderMessageFromTemplateAndVariables,
    sendEmailToUser,
    sendPUSHToUser,
    sendIosPushNotification,
    sendAndroidPushNotification,
    sendEmailQueryToAdmin,
    voiceCall,
  };
};
