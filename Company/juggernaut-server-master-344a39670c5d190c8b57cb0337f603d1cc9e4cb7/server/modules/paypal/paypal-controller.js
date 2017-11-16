const Boom = require('boom');
const paypal = require('paypal-rest-sdk');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];

  paypal.configure({
    mode: configs.PaypalConfiguration.config.SERVER.MODE, // sandbox or live
    client_id: configs.PaypalConfiguration.config.SERVER.CLIENTID,
    client_secret: configs.PaypalConfiguration.config.SERVER.CLIENTSECRET,
  });


  /**
     * @function <b>addcard</b> Method to Update Stripe Customer
     * @param {object} cardTokenToUse object containing cardTokenToUse
     * @param {object} stripeCustomerId object containing stripeCustomerId cardTokenToUse
     * @param {function} callback   callback Function
     */
  const createPayment = function (data, callback) {
    // eslint-disable-next-line camelcase
    const create_payment_json_back = {
      intent: data.intent,
      payer: {
        payment_method: data.paymentMethod,
        funding_instruments: [{
          credit_card: {
            type: data.type,
            number: data.cardNumber,
            expire_month: data.expMonth,
            expire_year: data.expYear,
            first_name: data.firstName,
            last_name: data.lastName,
            billing_address: {
              line1: data.line,
              city: data.city,
              state: data.state,
              postal_code: data.postalCode,
              country_code: data.countryCode,
            },
          },
        }],
      },
      transactions: [{
        amount: {
          total: data.totalAmount,
          currency: data.currency,
        },
        description: 'This is the payment transaction description.',
      }],
    };
    paypal.payment.create(create_payment_json_back, (error, payment) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, payment); }
    });
  };


  const createPaymentForOrder = function (data, callback) {
    // eslint-disable-next-line camelcase
    const create_payment_json_back = {
      intent: data.intent,
      payer: {
        payment_method: data.paymentMethod,
      },
      transactions: [{
        amount: {
          total: data.totalAmount,
          currency: data.currency,
        },
        payee: {
          email: data.payeeEmail,
        },
        description: 'This is the payment transaction description.',
      }],
      redirect_urls: {
        return_url: 'http://www.amazon.com',
        cancel_url: 'http://www.hawaii.com',
      },
    };

    paypal.payment.create(create_payment_json_back, (error, payment) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, payment); }
    });
  };


  /**
   * @function <b>addcard</b> Method to Update Stripe Customer
   * @param {object} cardTokenToUse object containing cardTokenToUse
   * @param {object} stripeCustomerId object containing stripeCustomerId cardTokenToUse
   * @param {function} callback   callback Function
   */
  const getPayment = function (data, callback) {
    paypal.payment.get(data.paymentID, (error, payment) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, payment); }
    });
  };


  const getSale = function (data, callback) {
    paypal.sale.get(data.saleID, (error, sale) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, sale); }
    });
  };


  const saleRefund = function (data, callback) {
    const refundPay = {
      amount: {
        currency: data.currency,
        total: data.totalAmount,
      },
    };

    paypal.sale.refund(data.saleID, refundPay, (error, refund) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, refund); }
    });
  };


  const getAuthorization = function (data, callback) {
    paypal.authorization.get(data.authorizationID, (error, authorization) => {
      if (error) {
        callback(Boom.wrap(error));
      } else { callback(null, authorization); }
    });
  };


  const captureAuthorization = function (data, callback) {
    // eslint-disable-next-line camelcase
    const capture_details = {
      amount: {
        currency: data.currency,
        total: data.totalAmount,
      },
      is_final_capture: true,
    };

    paypal.authorization.capture(data.authorizationID, capture_details, (error, capture) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, capture); }
    });
  };


  const showCaptureAuthorization = function (data, callback) {
    paypal.capture.get(data.captureID, (error, capture) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, capture); }
    });
  };


  const refundCapturePayment = function (data, callback) {
    // eslint-disable-next-line camelcase
    const refund_details = {
      amount: {
        currency: data.currency,
        total: data.totalAmount,
      },
    };

    paypal.capture.refund(data.captureID, refund_details, (error, refund) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, refund); }
    });
  };


  const showOrderDetails = function (data, callback) {
    paypal.order.get(data.orderID, (error, order) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, order); }
    });
  };


  const authorizeOrder = function (data, callback) {
    // eslint-disable-next-line camelcase
    const authorize_details = {
      amount: {
        currency: data.currency,
        total: data.totalAmount,
      },
    };

    paypal.order.authorize(data.orderID, authorize_details, (error, authorization) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, authorization); }
    });
  };


  // eslint-disable-next-line no-unused-vars
  const captureOrder = function (data, callback) {
    // eslint-disable-next-line camelcase
    const capture_details = {
      amount: {
        currency: data.currency,
        total: data.totalAmount,
      },
      is_final_capture: true,
    };

    paypal.order.capture(data.orderID, capture_details, (error, capture) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, capture); }
    });
  };


  const getAllPayments = function (data, callback) {
    const listPayment = {
      count: data.count,
      start_index: data.startIndex,
    };

    paypal.payment.list(listPayment, (error, payment) => {
      if (error) {
        winstonLogger.error(error);
        callback(Boom.wrap(error));
      } else { callback(null, payment); }
    });
  };


  //     var createPayout = function (data, callback) {
  //     var create_payout_json = {
  //     "sender_batch_header": {
  //         "sender_batch_id": sender_batch_id,
  //         "email_subject": "You have a payment"
  //     },
  //     "items": [
  //         {
  //             "recipient_type": "EMAIL",
  //             "amount": {
  //                 "value": 0.99,
  //                 "currency": "USD"
  //             },
  //             "receiver": "shirt-supplier-one@mail.com",
  //             "note": "Thank you.",
  //             "sender_item_id": "item_1"
  //         },
  //         {
  //             "recipient_type": "EMAIL",
  //             "amount": {
  //                 "value": 0.90,
  //                 "currency": "USD"
  //             },
  //             "receiver": "shirt-supplier-two@mail.com",
  //             "note": "Thank you.",
  //             "sender_item_id": "item_2"
  //         },
  //         {
  //             "recipient_type": "EMAIL",
  //             "amount": {
  //                 "value": 2.00,
  //                 "currency": "USD"
  //             },
  //             "receiver": "shirt-supplier-three@mail.com",
  //             "note": "Thank you.",
  //             "sender_item_id": "item_3"
  //         }
  //     ]
  // };

  // paypal.payout.create(create_payout_json, function (error, payout) {
  //     if (error) {
  //         throw error;
  //     } else {
  //     }
  // });

  //     }


  return {
    controllerName: 'PaypalController',
    createPayment,
    getPayment,
    getSale,
    saleRefund,
    getAuthorization,
    captureAuthorization,
    showCaptureAuthorization,
    refundCapturePayment,
    showOrderDetails,
    authorizeOrder,
    createPaymentForOrder,
    getAllPayments,
    //  createPayout: createPayout

  };
};
