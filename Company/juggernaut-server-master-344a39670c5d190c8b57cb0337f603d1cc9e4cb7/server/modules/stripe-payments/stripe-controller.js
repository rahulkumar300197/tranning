const stripePay = require('stripe');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const stripeToken = configs.StripeConfiguration.config.SERVER.STRIPE_SECRET_KEY;
  const stripe = stripePay(stripeToken);
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
     * @function <b>chargeCreditCard</b> Method to Charge Amount From Card
     * @param {object} cardTokenToCharge contain cardTokenToUse
     * @param {object} stripeCustomerId contain stripeCustomerId
     * @param {object} amount contain amount
     * @param {object} currency contain currency
     * @param {object} userId contain userId
     * @param {function} callback   callback Function
     */
  async function chargeCreditCard(payloadData, headers) {
    try {
      const data = await stripe.charges.create({
        amount: Math.round(payloadData.amount * 100),
        currency: payloadData.currency || 'usd',
        customer: payloadData.stripeCustomerId,
        description: `Charges for ${payloadData.userId || null}`,
      });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }
  /**
   * @function <b>createStripeCustomer</b> Method to Create Customer For Stripe
   * @param {object} cardTokenToCharge object containing cardTokenToUse
   * @param {object} userEmail object containing  email
   * @param {function} callback   callback Function
   */

  async function createStripeCustomer(headers, payloadData) {
    try {
      const data = await stripe.customers.create({
        description: `Customer for ${payloadData.email}`,
        email: payloadData.email,
        source: payloadData.cardTokenToUse,
      });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>deleteCustomer</b> Method to Delete Card For Customer
   * @param {object} payload object containing stripeCustomerId
   * @param {function} callback   callback Function
   */
  async function deleteCustomer(headers, payloadData) {
    try {
      const data = await stripe.customers.del(payloadData.stripeCustomerId);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }
  /**
   * @function <b>addcard</b> Method to Update Stripe Customer
   * @param {object} cardTokenToUse object containing cardTokenToUse
   * @param {object} stripeCustomerId object containing stripeCustomerId cardTokenToUse
   * @param {function} callback   callback Function
   */
  async function addCard(headers, payloadData) {
    try {
      const data = await stripe.customers.createSource(payloadData.stripeCustomerId, { source: payloadData.cardTokenToUse });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }
  /**
   * @function <b>makePayment</b> Method to Make Payment From Stripe
   * @param {object} paymentDetailsToCharge object containing stripeCustomerId,amountToCharge,cardId
   * @param {function} callback   callback Function
   */
  async function makePayment(headers, payloadData) {
    try {
      const data = await stripe.charges.create({
        amount: Math.round(payloadData.amountToCharge * 100),
        currency: payloadData.currency || 'usd',
        customer: payloadData.stripeCustomerId,
        card: payloadData.cardId,
      });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>makeHoldPayment</b> Method to Make hold Payment
   * @param {object} paymentDetailsToCharge object containing description,amountToCharge,stripeCustomerId,cardId
   * @param {function} callback   callback Function
   */
  async function makeHoldPayment(headers, payloadData) {
    try {
      const data = await stripe.charges.create({
        amount: Math.round(payloadData.amountToCharge * 100),
        currency: payloadData.currency || 'usd',
        customer: payloadData.stripeCustomerId,
        card: payloadData.cardId,
        capture: false,
        description: payloadData.description,
      });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }
  /**
   * @function <b>makeChargeForHoldPayment</b> Method to Make charge for hold payment
   * @param {object} paymentDetailsToCharge object containing  cardChargeId,amount
   * @param {function} callback   callback Function
   */
  async function makeChargeForHoldPayment(headers, payloadData) {
    try {
      const data = await stripe.charges.capture(payloadData.chargeId,
        { amount: Math.round(payloadData.amount * 100) });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }
  /**
   * @function <b>partialRefundAmount</b> Method to Refund Partial Amount
   * @param {object} paymentDetailsToRefund object containing Charge,amount
   * @param {function} callback   callback Function
   */
  async function partialRefundAmount(headers, payloadData) {
    try {
      const data = await stripe.refunds.create({
        charge: payloadData.chargeId,
        amount: Math.round(payloadData.amount * 100),
      });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>fullyRefundAmount </b> Method to Refund Full Amount
   * @param {object} paymentDetailsToRefund object containing Charge
   * @param {function} callback   callback Function
   */
  async function fullyRefundAmount(headers, payloadData) {
    try {
      const data = await stripe.refunds.create({ charge: payloadData.chargeId });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }
  /**
   * @function <b>cardCheckUnique </b> Method to Check Unique Card For Customer
   * @param {object} token object containing token
   * @param {function} callback   callback Function
   */
  async function cardCheckUnique(headers, queryData) {
    try {
      const data = await stripe.tokens.retrieve(queryData.cardToken);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }


  /**
   * @function <b>cardDelete </b> Method to Delete Card For Customer
   * @param {object} customerId object containing customerId
   * @param {object} cardId object containing  cardId
   * @param {function} callback   callback Function
   */
  async function cardDelete(headers, payloadData) {
    try {
      const data = await stripe.customers.deleteCard(payloadData.stripeCustomerId, payloadData.cardId);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }

  /**
   * @function <b>updateDefaultCard</b> Method to Update Default Card For Customer
   * @param {object} customerId object containing customerId
   * @param {object} cardId object containing  cardId
   * @param {function} callback   callback Function
   */
  async function updateDefaultCard(headers, payloadData) {
    try {
      const data = await stripe.customers.update(payloadData.stripeCustomerId, { default_source: payloadData.cardId });
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return universalFunctions.paymentFailure(headers, error);
    }
  }


  return {
    controllerName: 'StripeController',
    chargeCreditCard,
    createStripeCustomer,
    addCard,
    deleteCustomer,
    makePayment,
    makeHoldPayment,
    makeChargeForHoldPayment,
    partialRefundAmount,
    fullyRefundAmount,
    cardCheckUnique,
    cardDelete,
    updateDefaultCard,
  };
};
