const childProcess = require('child_process');
const schedule = require('node-schedule');

const internals = {};

internals.scriptS3 = function (server, next) {
  schedule.scheduleJob('0 0 5 * * 0', () => {
    const S3KEY = process.env.S3KEY;
    const S3SECRET = process.env.S3SECRET;
    const bucketName = process.env.bucketName;
    const s3Link = process.env.s3Link;
    childProcess.exec(`"./scripts/LogToS3.sh" ${S3KEY} ${S3SECRET} ${bucketName} ${s3Link}`);
  });
  next();
};

exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-controller', 'core-models', 'core-config', 'core-services'], internals.scriptS3);
  next();
};


exports.register.attributes = {
  name: 'scriptS3',
};
