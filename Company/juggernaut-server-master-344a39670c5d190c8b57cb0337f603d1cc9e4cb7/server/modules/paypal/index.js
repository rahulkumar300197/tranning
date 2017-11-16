

const Joi = require('joi');


const internals = {};


internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  server.route({
    method: 'POST',
    path: '/paypal/createPayment',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      controllers.PaypalController.createPayment(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'create payment',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          intent: Joi.string().required().description('sale or authorize'),
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          type: Joi.string().required().description('visa'),
          paymentMethod: Joi.string().required().description('credit_card or paypal'),
          cardNumber: Joi.string().required(),
          currency: Joi.string().required().description('USD'),
          expMonth: Joi.string().required(),
          totalAmount: Joi.string().required(),
          expYear: Joi.string().required(),
          line: Joi.string().required(),
          state: Joi.string().required(),
          postalCode: Joi.string().required().description('43210'),
          city: Joi.string().required(),
          countryCode: Joi.string().required().description('US'),
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
    path: '/paypal/createPaymentForOrder',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      controllers.PaypalController.createPaymentForOrder(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'Update Stripe Customer',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          intent: Joi.string().required().description('sale or authorize'),
          firstName: Joi.string().required(),
          lastName: Joi.string().required(),
          type: Joi.string().required().description('visa'),
          paymentMethod: Joi.string().required().description('credit_card or paypal'),
          currency: Joi.string().required().description('USD'),
          totalAmount: Joi.string().required(),
          payeeEmail: Joi.string().required(),
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
    path: '/paypal/getPayment',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.query;
      controllers.PaypalController.getPayment(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'get Payment details',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          paymentID: Joi.string().required().description('paymentID'),
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
    path: '/paypal/getSale',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.query;
      controllers.PaypalController.getSale(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'get sale details',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          saleID: Joi.string().required().description('saleID'),
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
    path: '/paypal/saleRefund',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      controllers.PaypalController.saleRefund(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'sale refund',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          saleID: Joi.string().required().description('saleID'),
          totalAmount: Joi.string().required().description('totalAmount'),
          currency: Joi.string().required().description('USD'),
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
    path: '/paypal/getAuthorization',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.query;
      controllers.PaypalController.getAuthorization(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'get authorization details',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          authorizationID: Joi.string().required().description('authorizationID'),
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


  //  server.route({
  //     method: 'GET',
  //     path: '/paypal/getOrderDetails',
  //     handler: function (request, reply) {
  //         let lang = request.headers['content-language'];
  //         var payloadData = request.query;
  //         controllers.PaypalController.showOrderDetails(payloadData, function (err, data) {
  //             if (err) {
  //                 reply(universalFunctions.paymentFailure(headers, err));
  //             }
  //             else {
  //                 reply(universalFunctions.sendSuccess(null, data, lang));
  //             }
  //         });
  //     },
  //     config: {
  //         description: 'get authorization details',
  //         tags: ['api', 'paypal'],
  //          validate: {
  //             query: {
  //                 orderID: Joi.string().required().description("paymentID"),
  //             },
  //             failAction: universalFunctions.failActionFunction
  //         },
  //         plugins: {
  //             'hapi-swagger': {
  //                 payloadType: 'form',
  //                 responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages')
  //             }
  //         }
  //     }

  // });


  server.route({
    method: 'POST',
    path: '/paypal/captureAuthorization',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      controllers.PaypalController.captureAuthorization(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'get authorization details',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          authorizationID: Joi.string().required().description('authorizationID'),
          currency: Joi.string().required().description('USD'),
          totalAmount: Joi.string().required().description('totalAmount'),
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


  //  server.route({
  //     method: 'POST',
  //     path: '/paypal/authorizeOrder',
  //     handler: function (request, reply) {
  //         let lang = request.headers['content-language'];
  //         controllers.PaypalController.authorizeOrder(null, function (err, data) {
  //             if (err) {
  //                 reply(universalFunctions.paymentFailure(headers, err));
  //             }
  //             else {
  //                 reply(universalFunctions.sendSuccess(null, data, lang));
  //             }
  //         });
  //     },
  //     config: {
  //         description: 'get authorization details',
  //         tags: ['api', 'paypal'],
  //          validate: {
  //             payload: {
  //                  orderID: Joi.string().required().description("paymentID"),
  //                  currency: Joi.string().required().description("paymentID"),
  //                  totalAmount: Joi.string().required().description("paymentID")
  //             },
  //             failAction: universalFunctions.failActionFunction
  //         },
  //          plugins: {
  //             'hapi-swagger': {
  //                 payloadType: 'form',
  //                 responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages')
  //             }
  //         }
  //     }

  // });


  //  server.route({
  //     method: 'POST',
  //     path: '/paypal/captureOrder',
  //     handler: function (request, reply) {
  //         let lang = request.headers['content-language'];
  //         controllers.PaypalController.captureOrder(null, function (err, data) {
  //             if (err) {
  //                 reply(universalFunctions.paymentFailure(headers, err));
  //             }
  //             else {
  //                 reply(universalFunctions.sendSuccess(null, data, lang));
  //             }
  //         });
  //     },
  //     config: {
  //         description: 'get authorization details',
  //         tags: ['api', 'paypal'],
  //          validate: {
  //             payload: {
  //                  orderID: Joi.string().required().description("paymentID"),
  //                  currency: Joi.string().required().description("paymentID"),
  //                  totalAmount: Joi.string().required().description("paymentID")
  //             },
  //             failAction: universalFunctions.failActionFunction
  //         },
  //          plugins: {
  //             'hapi-swagger': {
  //                 payloadType: 'form',
  //                 responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages')
  //             }
  //         }
  //     }

  // });


  server.route({
    method: 'POST',
    path: '/paypal/refundCaptureAmount',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.payload;
      controllers.PaypalController.refundCapturePayment(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'get authorization details',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        payload: {
          captureID: Joi.string().required().description('captureID'),
          currency: Joi.string().required().description('USD'),
          totalAmount: Joi.string().required().description('totalAmount'),
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
    path: '/paypal/showCaptureAuthorization',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.query;
      controllers.PaypalController.showCaptureAuthorization(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'get authorization details',
      tags: ['api', 'paypal'],
      validate: {
        query: {
          captureID: Joi.string().required().description('captureID'),
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
    path: '/paypal/getAllPayments',
    handler(request, reply) {
      const headers = request.headers;
      const payloadData = request.query;
      controllers.PaypalController.getAllPayments(payloadData, (err, data) => {
        if (err) {
          reply(universalFunctions.paymentFailure(headers, err));
        } else {
          reply(universalFunctions.sendSuccess(headers, data));
        }
      });
    },
    config: {
      description: 'get authorization details',
      tags: ['api', 'paypal'],
      validate: {
        headers: Joi.object({
          'content-language': Joi.string().required().description('en/ar'),
        }).unknown(),
        query: {
          count: Joi.string().required().description('count'),
          startIndex: Joi.string().required().description('startIndex'),
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


  // server.route({
  //     method: 'POST',
  //     path: '/paypal/createPayout',
  //     handler: function (request, reply) {
  //         let lang = request.headers['content-language'];
  //         var payloadData = request.payload;
  //         controllers.PaypalController.createPayout(payloadData, function (err, data) {
  //             if (err) {
  //                 reply(universalFunctions.paymentFailure(headers, err));
  //             } else {
  //                 reply(universalFunctions.sendSuccess(null, data, lang));
  //             }
  //         });
  //     },
  //     config: {
  //         description: 'get authorization details',
  //         tags: ['api', 'paypal'],
  //         validate: {
  //             payload: {
  //                 arrayObj: Joi.array().items(Joi.object().keys({
  //                     recipientType: Joi.string().required().description("recipientType"),
  //                     amount: Joi.object().keys({
  //                         value: Joi.string().required().description("ammount value"),
  //                         currency: Joi.string().required().description("currency example USD"),
  //                     }),
  //                     receiver: Joi.string().required().description("receiver email id"),
  //                     note: Joi.string().required(),
  //                     sender_item_id: Joi.string().required(),
  //                 }).description("payload for create payout"))
  //             },
  //             failAction: universalFunctions.failActionFunction
  //         },
  //         plugins: {
  //             'hapi-swagger': {
  //                 responseMessages: configs.AppConfiguration.get('/swaggerDefaultResponseMessages')
  //             }
  //         }
  //     }

  // });


  next();
};

exports.register = function (server, options, next) {
  server.dependency(['auth',
    'users',
    'core-controller',
    'core-models',
    'core-config',
    'core-utility-functions',
    'core-services',
  ], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'paypal-payments',
};
