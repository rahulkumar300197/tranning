const Confidence = require('confidence');

const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const config = {
    from: {
      $filter: 'lang',
      en: 'Base Project Team',
      ar: 'فريق المشروع الأسسي ',
    },
    notificationMessages: {
      verificationCodeMsg: 'Your 4 digit verification code for BaseProject is {{otpCode}}',
      loginCredentialsMsg: 'Hi {{user_name}} \n Your login credentials are as following\n username: {{email}}\n password: {{password}}',
      registrationEmail: {
        $filter: 'lang',
        en: {
          emailMessage: "Dear {{user_name}}, <br><br> Please  <a href='{{{verification_url}}}'>click here</a> to verify your email address",
          emailSubject: 'Welcome to BaseProject',
        },
        ar: {
          // eslint-disable-next-line max-len
          emailMessage: "<p dir='rtl'>زيزنا {{user_name}}، <br> <br> الرجاء <a href='{{{verification_url}}}'> النقر هنا </a> للتحقق من عنوان بريدك الإلكتروني</p>",
          emailSubject: 'مرحبا بكم في باسبروجيكت',
        },
      },
      loginCredentialsEmail: {
        $filter: 'lang',
        en: {
          // eslint-disable-next-line max-len
          emailMessage: "Dear {{user_name}},<br><br>Welcome to Base Project ! <br>Please <a href='{{{verification_url}}}'>click here</a> to add your password",
          emailSubject: 'Welcome to BaseProject',
        },
        ar: {
          // eslint-disable-next-line max-len
          emailMessage: "<p dir='rtl'>عزيزي {{user_name}}، <br> <br> مرحبا بك في مشروع بيس! <br> الرجاء <a href='{{{verification_url}}}'> النقر هنا </a> لإضافة كلمة المرور</p>",
          emailSubject: 'مرحبا بكم في باسبروجيكت',
        },
      },
      otpEmail: {
        // eslint-disable-next-line max-len
        emailMessage: 'Dear {{user_name}}, <br><br> Your 4 digit verification code for BaseProject is {{otpCode}} <br><br><br><br>If you have not created this account, please <a href=\'{{deleteRoute}}\'> click here to remove your details </a>',
        emailSubject: 'OTP for BaseProject',
      },
      query: {
        emailMessage: 'Dear Admin, <br><br>{{user_name}} has following query :<br><br> {{query}} <br><br><br><br>',
        emailSubject: 'Query',
      },
      contactDriverForm: {
        // eslint-disable-next-line max-len
        emailMessage: 'A new driver has showed interest <br><br> Details : <br><br> Name : {{fullName}} <br><br> Email : {{email}} <br><br> Phone No : {{phoneNo}} <br><br> Vehicle Type : {{vehicleType}} <br><br> Bank Account : {{bankAccountBoolean}} <br><br> Heard From : {{heardFrom}}',
        emailSubject: 'New Driver Contact Request',
      },
      contactBusinessForm: {
        // eslint-disable-next-line max-len
        emailMessage: 'A new business has showed interest <br><br> Details : <br><br> Name : {{fullName}} <br><br> Email : {{email}} <br><br> Phone No : {{phoneNo}} <br><br> Business Name: {{businessName}} <br><br> Business Address: {{businessAddress}}  <br><br> Delivery Service : {{ownDeliveryService}} <br><br> Heard From : {{heardFrom}}',
        emailSubject: 'New Business Contact Request',
      },
      forgotPassword: {
        // eslint-disable-next-line max-len
        emailMessage: "Dear {{user_name}}, <br><br> Please, <a href='{{{password_reset_link}}}'> Click Here </a> To Reset Your Password",
        emailSubject: 'Password Reset Notification For Base Project',
      },
      billOfLading: {
        emailSubject: 'BOL for your shipment',
      },
    },
    twilioCredentials: {
      $filter: 'env',
      production: {
        accountSid: 'AC73b6ce9c0191ac1f8e7227489bdd3dc1',
        authToken: '6795e0e61f906fe22b69c10fe8094975',
        smsFromNumber: '+19375834393',
      },
      test: {
        accountSid: 'AC73b6ce9c0191ac1f8e7227489bdd3dc1',
        authToken: '6795e0e61f906fe22b69c10fe8094975',
        smsFromNumber: '+19375834393',
      },
      dev: {
        accountSid: 'AC73b6ce9c0191ac1f8e7227489bdd3dc1',
        authToken: '6795e0e61f906fe22b69c10fe8094975',
        smsFromNumber: '+19375834393',
      },
      $default: {
        accountSid: 'AC73b6ce9c0191ac1f8e7227489bdd3dc1',
        authToken: '6795e0e61f906fe22b69c10fe8094975',
        smsFromNumber: '+19375834393',
      },
    },
    twilioCall: {
      callURL: 'http://0.0.0.0/calling.php?number=',
    },
    DATABASE: {
      $filter: 'DATABASE',
      PROFILE_PIC_PREFIX: {
        ORIGINAL: 'profilePic_',
        THUMB: 'profileThumb_',
      },
      USER_ROLES: {
        CUSTOMER: 'customer',
        Driver: 'driver',
        ServiceProvider: 'serviceProvider',
      },
      LOGO_PREFIX: {
        ORIGINAL: 'logo_',
        THUMB: 'logoThumb_',
      },
      CONSTANT_TYPE: {
        TAX: 'TAX',
        CANCEL_FEE: 'CANCEL_FEE',
        CONTRACT: 'CONTRACT',
        ADMIN_FEE: 'ADMIN_FEE',
      },
      DOCUMENT_PREFIX: 'document_',
      DRIVER: 'driver_',
      CUSTOMER: 'customer_',
      OTHER: 'doc_',
      FILE_TYPES: {
        LOGO: 'LOGO',
        DOCUMENT: 'DOCUMENT',
        OTHERS: 'OTHERS',
      },
      VEHICLE_TYPE: {
        BICYCLE: 'BICYCLE',
        SCOOTER: 'SCOOTER',
        CAR: 'CAR',
      },
      DEVICE_TYPES: {
        IOS: 'IOS',
        ANDROID: 'ANDROID',
        WEB: 'WEB',
      },
      LANGUAGE: {
        EN: 'EN',
        ES_MX: 'ES_MX',
      },
    },


    iOSPushSettings: {

      customer: {
        $filter: 'env',
        production: {
          iosApnCertificate: '/Certs/basefile.pem',
          gateway: 'gateway.push.apple.com',
        },
        test: {
          iosApnCertificate: '/Certs/basefile.pem',
          gateway: 'gateway.sandbox.push.apple.com',
        },
        dev: {
          iosApnCertificate: '/Certs/basefile.pem',
          gateway: 'gateway.sandbox.push.apple.com',
        },
        $default: {
          iosApnCertificate: '/Certs/basefile.pem',
          gateway: 'gateway.sandbox.push.apple.com',
        },
      },

      driver: {
        $filter: 'env',
        production: {
          iosApnCertificate: '/Certs/basefile.pem',
          gateway: 'gateway.push.apple.com',
        },
        test: {
          iosApnCertificate: '/Certs/basefile.pem',
          gateway: 'gateway.push.apple.com',
        },
        dev: {
          iosApnCertificate: '/Certs/basefile.pem',
          gateway: 'gateway.push.apple.com',
        },
        $default: {
          iosApnCertificate: '/Certs/basefile.pem',
          gateway: 'gateway.push.apple.com',
        },
      },
    },

    androidPushSettings: {
      customer: {
        brandName: 'EIYA',
        // eslint-disable-next-line max-len
        gcmSender: 'AAAAWI5cQn0:APA91bH9PCiIwogSvT_yPitz-fu4nX3A9_9W_vDI-5pVmXglmcNvPcvo76KE3h_JGw0uhiVKznL6dSH0tHphTKXXwzoYtdSUIkYaLGs31DWa-9iyYnAuR8bznpXt1RI4nvvnN9Yk_q2DcEOsjDFPVLPPB-1ZUjJcHw',
        // eslint-disable-next-line max-len
        fcmSender: 'AAAAWI5cQn0:APA91bH9PCiIwogSvT_yPitz-fu4nX3A9_9W_vDI-5pVmXglmcNvPcvo76KE3h_JGw0uhiVKznL6dSH0tHphTKXXwzoYtdSUIkYaLGs31DWa-9iyYnAuR8bznpXt1RI4nvvnN9Yk_q2DcEOsjDFPVLPPB-1ZUjJcHw',
      },
      driver: {
        brandName: 'EIYA',
        // eslint-disable-next-line max-len
        gcmSender: 'AAAAWI5cQn0:APA91bH9PCiIwogSvT_yPitz-fu4nX3A9_9W_vDI-5pVmXglmcNvPcvo76KE3h_JGw0uhiVKznL6dSH0tHphTKXXwzoYtdSUIkYaLGs31DWa-9iyYnAuR8bznpXt1RI4nvvnN9Yk_q2DcEOsjDFPVLPPB-1ZUjJcHw',
        // eslint-disable-next-line max-len
        fcmSender: 'AAAAWI5cQn0:APA91bH9PCiIwogSvT_yPitz-fu4nX3A9_9W_vDI-5pVmXglmcNvPcvo76KE3h_JGw0uhiVKznL6dSH0tHphTKXXwzoYtdSUIkYaLGs31DWa-9iyYnAuR8bznpXt1RI4nvvnN9Yk_q2DcEOsjDFPVLPPB-1ZUjJcHw',
      },
    },

    nodeMailer: {
      Mandrill: {
        $filter: 'env',
        production: {
          service: 'SendGrid',
          auth: {
            user: 'juggernautNext', // postmaster@sandbox[base64 string].mailgain.org
            pass: 'clicklabs01', // You set this.
          },
        },
        test: {
          service: 'SendGrid',
          auth: {
            user: 'juggernautNext', // postmaster@sandbox[base64 string].mailgain.org
            pass: 'clicklabs01', // You set this.
          },
        },
        dev: {
          service: 'SendGrid',
          auth: {
            user: 'juggernautNext', // postmaster@sandbox[base64 string].mailgain.org
            pass: 'clicklabs01', // You set this.
          },
        },
        $default: {
          service: 'SendGrid',
          auth: {
            user: 'juggernautNext', // postmaster@sandbox[base64 string].mailgain.org
            pass: 'clicklabs01', // You set this.
          },
        },
      },
    },
  };
  const store = new Confidence.Store(config);

  const get = function (key, criteria) {
    return store.get(key, criteria);
  };


  const meta = function (key, criteria) {
    return store.meta(key, criteria);
  };


  return {
    configurationName: 'NotificationConfig',
    config,
    get,
    meta,
  };
};
