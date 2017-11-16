//* ** USE MONGO */
const mongoose = P.promisifyAll(require('mongoose'));
// const mongoose1 = P.promisifyAll(require('mongoose'));

const Config = require('../config');

mongoose.Promise = P;
const internals = {};

internals.initilize = function (server, next) {
  mongoose.connect(Config.get('/hapiMongoModels/mongodb/uri', { env: process.env.NODE_ENV }))
    .then(() => {
      //eslint-disable-next-line
      winstonLogger.info('MongoDB Connected', Config.get('/hapiMongoModels/mongodb/uri', { env: process.env.NODE_ENV }));
    })
    .catch((error) => {
      //eslint-disable-next-line
      winstonLogger.error('MongoDB Exit, error in bootstraping.........................', error);
      process.exit(1);
    });

  if (process.env.MONGO_DEBUG === 'true') {
    mongoose.set('debug', true);
  }

  process.on('SIGINT', () => {
    mongoose.disconnect((err) => {
      if (err) {
        //eslint-disable-next-line
        winstonLogger.error(err);
      }
      //eslint-disable-next-line
      winstonLogger.info('Database disconnected');
      process.exit(1);
    });
  });

  server.expose('mongoose', mongoose);

  next();
};

exports.register = function (server, options, next) {
  server.dependency(['core-config'], internals.initilize);
  next();
};

exports.register.attributes = {
  name: 'bootstrap',
};
