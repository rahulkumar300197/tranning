const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
     * @function <b> voiceCallByCustomer </b> voice call to service provider by customer with twilio
     * @param {object} payloadData service provider details
     * @param {object} userData customer details
     * @param {function} callback
     */
  async function voiceCallByCustomer(payloadData, userData, headers) {
    try {
      let customerMobile;
      let customerCountryCode;
      let serviceProviderMobile;
      let serviceProviderCountryCode;
      let criteria = {};
      criteria = {
        _id: payloadData.serviceProviderId,
      };
      const serviceProviderNumber = await services.UserService.getUserDetails(criteria);
      if (userData === null) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      for (let i = 0; i < userData.contacts.length; i += 1) {
        if (userData.contacts[i].isPrimary) {
          customerMobile = userData.contacts[i].mobile;
          customerCountryCode = userData.contacts[i].countryCode;
        }
      }
      const customerSupportCriteria = {};
      const customerSupportProjections = {
        countryCode: 1,
        mobile: 1,
      };
      // eslint-disable-next-line max-len
      const customerSupportNumber = await services.MongoService.getDataAsync('CustomerSupport', customerSupportCriteria, customerSupportProjections, {});

      for (let i = 0; i < serviceProviderNumber[0].contacts.length; i += 1) {
        if (serviceProviderNumber[0].contacts[i].isPrimary) {
          serviceProviderMobile = serviceProviderNumber[0].contacts[i].mobile;
          serviceProviderCountryCode = serviceProviderNumber[0].contacts[i].countryCode;
        }
      }
      const objToSave = {
        callerRole: userData.role,
        caller: userData._id,
        fromPhoneNumber: customerCountryCode + customerMobile,
        toPhoneNumber: serviceProviderCountryCode + serviceProviderMobile,
        recieverRole: serviceProviderNumber[0].role,
        reciever: serviceProviderNumber[0]._id,
      };
      const twilioData = await services.MongoService.createData('twilioCallRequest', objToSave);
      if (twilioData) {
        if ((customerMobile || serviceProviderMobile || customerSupportNumber[0]) == null) {
          throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
        }
        const from = customerCountryCode + customerCountryCode;
        const to = serviceProviderCountryCode + serviceProviderMobile;
        const customerSupport = customerSupportNumber[0].countryCode + customerSupportNumber[0].mobile;
        const twilioCall = await services.Notification.voiceCall(to, from, customerSupport);
        return universalFunctions.sendSuccess(headers, twilioCall);
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>voiceCallByServiceProvider</b> voice call to customer by service provider
   * @param {object} payloadData  customer to be called details
   * @param {object} userData service provider details
   * @param {function} callback
   */
  async function voiceCallByServiceProvider(payloadData, userData, headers) {
    try {
      let serviceProviderMobile;
      let serviceProviderCountryCode;
      let customerMobile;
      let countryCountryCode;
      let criteria = {};
      criteria = {
        _id: payloadData.userId,
      };
      const customerNumber = await services.UserService.getUserDetails(criteria);
      if (userData === null) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' }));
      }
      for (let i = 0; i < userData.contacts.length; i += 1) {
        if (userData.contacts[i].isPrimary) {
          serviceProviderMobile = userData.contacts[i].mobile;
          serviceProviderCountryCode = userData.contacts[i].countryCode;
        }
      }
      const customerSupportCriteria = {};
      const customerSupportProjections = {
        countryCode: 1,
        mobile: 1,
      };
      // eslint-disable-next-line max-len
      const customerSupportNumber = await services.MongoService.getDataAsync('CustomerSupport', customerSupportCriteria, customerSupportProjections, {});

      for (let i = 0; i < customerNumber[0].contacts.length; i += 1) {
        if (customerNumber[0].contacts[i].isPrimary) {
          customerMobile = customerNumber[0].contacts[i].mobile;
          countryCountryCode = customerNumber[0].contacts[i].countryCode;
        }
      }
      const objToSave = {
        callerRole: userData.role,
        caller: userData._id,
        fromPhoneNumber: serviceProviderCountryCode + serviceProviderMobile,
        toPhoneNumber: countryCountryCode + customerMobile,
        recieverRole: customerNumber[0].role,
        reciever: customerNumber[0]._id,
      };
      const twilioData = await services.MongoService.createData('twilioCallRequest', objToSave);
      if (twilioData) {
        if ((serviceProviderMobile || customerMobile || results.customerSupportNumber[0]) == null) {
          return done(Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'USER_NOT_FOUND' })));
        }
        const from = serviceProviderCountryCode + serviceProviderMobile;
        const to = countryCountryCode + customerMobile;
        const customerSupport = customerSupportNumber[0].countryCode + customerSupportNumber[0].mobile;
        const twilioCall = await services.Notification.voiceCall(to, from, customerSupport);
        return universalFunctions.sendSuccess(headers, twilioCall);
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'TwilioController',
    voiceCallByCustomer,
    voiceCallByServiceProvider,

  };
};
