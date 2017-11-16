const Glue = require('glue');
const Manifest = require('./server/manifest');
global.P = require('bluebird');

const composeOptions = {
  relativeTo: __dirname,
};

module.exports = Glue.compose.bind(Glue, Manifest.manifest, composeOptions);
