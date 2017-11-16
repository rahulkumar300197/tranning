const composer = require('./index');
const isPortFree = P.promisifyAll(require('is-port-free'));
require('./server/modules/logger/winstonLogger.js');



const Config = require('./server/config');

const criteria = {
  env: process.env.NODE_ENV,
};

// commented raven to avoid socket.destroy error because of http2
// const Raven = require('raven');
// Raven.config(Config.get('/sentry', criteria)).install();

async function serverSetup(server) {
  try {
    const port = server.info.port;
    // console.log(await isPortFree(port));
    await isPortFree(port);
    server.start();
    winstonLogger.info('server is running at -------------------------------> ', server.info.uri);
  } catch (error) {
    winstonLogger.error('unable to start server -----------------------------> ', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (err) => {
  winstonLogger.error('uncaught Exception Occurred ------------> ', err.stack);
});

composer((error, server) => {
  if (error) {
    winstonLogger.error('uncaught Exception Occurred ------------> ', error);
    process.exit(1);
  }
  serverSetup(server);


  server.ext({
    type: 'onPreResponse',
    method(request, reply) {
      if (request.response.output) {
        winstonLogger.error(request.info.remoteAddress, request.response);
      }
      reply.continue();
    },
  });
});

