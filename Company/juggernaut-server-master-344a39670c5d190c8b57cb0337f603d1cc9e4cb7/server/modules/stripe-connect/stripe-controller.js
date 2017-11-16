const moment = require('moment');
const fs = require('fs');
const stripeConnect = require('stripe');

const fp = fs.readFileSync(`${__dirname}/123456.png`);

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const stripe = stripeConnect(configs.StripeConfiguration.config.SERVER.STRIPE_SECRET_KEY);
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  /**
   * @function <b>createCardToken</b> <br>
   * Method for creating card for token
   * @param {object} data  data required for card details
   * @param {*} callback   callback Function
   */
  async function createCardToken(headers, payloadData) {
    try {
      const dataToSend = {
        number: payloadData.number,
        exp_month: payloadData.expMonth,
        exp_year: payloadData.expYear,
        cvc: payloadData.cvc,
        currency: payloadData.currency,
      };
      const stripeData = await stripe.tokens.create({ card: dataToSend });
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>create_bank_account_token</b> <br>
   * Method for creating bank account token
   * @param {object} data  data for creating bank token
   * @param {*} callback   callback Function
   */

  async function createBankAccountToken(headers, payloadData) {
    try {
      const dataToSend = {
        account_holder_name: payloadData.accountHolderName,
        account_number: payloadData.accountNumber,
        country: payloadData.country,
        currency: payloadData.currency,
        routing_number: payloadData.routingNumber,
      };
      const stripeData = await stripe.tokens.create({ bank_account: dataToSend });
      return stripeData;
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>fileupload</b> <br>
   * Method for verification of user by uploading file
   * @param {object} data  data Of User account
   * @param {*} callback   callback Function
   */

  async function fileUpload(headers) {
    try {
      const stripeData = await stripe.fileUploads.create({
        purpose: 'identity_document',
        file: {
          data: fp,
          name: '123456.png',
          type: 'application/octet-stream',
        },
      });
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>createUser</b> <br>
   * Method for creating managed account for user
   * @param {object} user  data Of User to be created
   * @param {*} callback   callback Function
   */
  async function createUser(headers, payloadData) {
    try {
      const date = Math.round(new Date().getTime() / 1000);
      const day = moment(payloadData.dob).format('DD');
      const month = moment(payloadData.dob).format('MM');
      const year = moment(payloadData.dob).format('YYYY');
      const accountDetails = {
        object: payloadData.object,
        country: payloadData.country,
        currency: payloadData.currency,
        account_number: payloadData.accountNumber,
        routing_number: payloadData.routingNumber,
      };
      const tos = {
        date,
        ip: payloadData.ip,

      };
      const legalEntity = {
        dob: {
          day,
          month,
          year,
        },
        first_name: payloadData.firstName,
        last_name: payloadData.lastName,
        address: {
          line1: payloadData.street,
          postal_code: payloadData.postalCode,
          city: payloadData.city,
          state: payloadData.state,
        },
        ssn_last_4: payloadData.ssnLast4,
        type: payloadData.type,
      };

      const data = {
        managed: payloadData.managed,
        email: payloadData.email,
        country: payloadData.country,
        external_account: accountDetails,
        tos_acceptance: tos,
        legal_entity: legalEntity,
      };
      const stripeData = await stripe.accounts.create(data);
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>update</b> <br>
   * Method for updating user Account for verification
   * @param {object} updateData  data to be updated
   * @param {*} callback   callback Function
   */

  async function update(headers, payloadData) {
    try {
      const key = payloadData.accountKey;
      const legalEntity = {
        legal_entity: {
          verification: {
            document: payloadData.fileCode,
          },
          personal_id_number: payloadData.personalNumber,
        },
      };
      const stripeData = await stripe.accounts.update(key, legalEntity);
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>createCard</b> <br>
   * Method for creating card from token
   * @param {object} data  data of card details
   * @param {*} callback   callback Function
   */

  async function createCard(headers, payloadData) {
    try {
      const stripeData = await stripe.accounts.createExternalAccount(
        payloadData.accountKey, { external_account: payloadData.cardToken }
      );
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>create_bank_account</b> <br>
   * Method for creating bank account
   * @param {object} data  data for creating bank account
   * @param {*} callback   callback Function
   */

  async function createBankAccount(headers, payloadData) {
    try {
      const bankToken = payloadData.bankToken;
      const stripeData = await stripe.accounts.createExternalAccount(
        payloadData.accountKey, { external_account: bankToken }
      );
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>create_charge</b> <br>
   * Method for creating charge
   * @param {object} data  data of for creating charge
   * @param {*} callback   callback Function
   */

  async function createCharge(headers, payloadData) {
    try {
      const data = {
        amount: payloadData.amount,
        application_fee: payloadData.applicationFee,
        currency: payloadData.currency,
        source: payloadData.source,
        description: payloadData.description,
        destination: {
          account: payloadData.destination,
        },
      };
      const stripeData = await stripe.charges.create(data);
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>getuser</b> <br>
   * Method for fetching managed account details of user
   * @param {object} account_key  key Of User account
   * @param {*} callback   callback Function
   */

  async function getUser(headers, queryData) {
    try {
      const stripeData = await stripe.accounts.retrieve(queryData.accountKey);
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>getAccountBalance</b> <br>
   * Method for fetching managed account balance of user
   * @param {object} account_key  key Of User account
   * @param {*} callback   callback Function
   */

  async function getAccountBalance(headers) {
    try {
      const stripeData = await stripe.balance.retrieve();
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>get_connected_account</b> <br>
   * Method for getting all connected accounts
   * @param {object} limitno  limit for showing details
   * @param {*} callback   callback Function
   */

  async function getConnectedAccount(headers, queryData) {
    try {
      const stripeData = await stripe.accounts.list({
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
      });
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>list_all_charges</b> <br>
   * Method for getting all charge details
   * @param {object} data  data for getting charge details
   * @param {*} callback   callback Function
   */

  async function listAllCharges(headers, queryData) {
    try {
      const stripeData = await stripe.charges.list({
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
      });
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
  * @function <b>retrive_charge</b> <br>
  * Method for retriving charge
  * @param {object} account_key  chargeID required for getting details
  * @param {*} callback   callback Function
  */

  async function retriveCharge(headers, queryData) {
    try {
      const stripeData = await stripe.charges.retrieve(queryData.chargeID);
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>delete_bank_account</b> <br>
   * Method for deleting bank account
   * @param {object} data  data for deleting bank details
   * @param {*} callback   callback Function
   */
  async function deleteBankAccount(headers, queryData) {
    try {
      const customerID = queryData.accountKey;
      const bankID = queryData.bankID;
      const stripeData = await stripe.accounts.deleteExternalAccount(customerID, bankID);
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>delete_account</b> <br>
   * Method for deleting user Account
   * @param {object} account_key  key of user
   * @param {*} callback   callback Function
   */

  async function deleteAccount(headers, queryData) {
    try {
      const stripeData = await stripe.accounts.del(queryData.accountKey);
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>retrive_bank_account</b> <br>
   * Method for getting bank details
   * @param {object} data  data for getting bank details
   * @param {*} callback   callback Function
   */
  async function retriveBankAccount(headers, queryData) {
    try {
      const customerID = queryData.accountKey;
      const bankID = queryData.bankID;
      const stripeData = await stripe.accounts.retrieveExternalAccount(customerID, bankID);
      return universalFunctions.sendSuccess(headers, stripeData);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  return {
    controllerName: 'stripeController',
    createCardToken,
    createBankAccountToken,
    fileUpload,
    createUser,
    update,
    createCard,
    createBankAccount,
    createCharge,
    getUser,
    getAccountBalance,
    getConnectedAccount,
    listAllCharges,
    retriveCharge,
    deleteBankAccount,
    retriveBankAccount,
    deleteAccount,
  };
};
