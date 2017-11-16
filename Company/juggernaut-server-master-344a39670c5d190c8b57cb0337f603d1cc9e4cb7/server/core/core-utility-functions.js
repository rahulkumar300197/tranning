

const Hoek = require('hoek');
const Joi = require('joi');
const Async = require('async');
const Path = require('path');
const Glob = require('glob');


// Declare internals

const internals = {
  schema: Joi.object({
    globPattern: Joi.string().required(),
    globOptions: Joi.object({
      cwd: Joi.string().required(),
    }).unknown(true).required(),
  }),
};


exports.register = function (server, options, next) {
  options = Hoek.applyToDefaults({}, options);
  const results = Joi.validate(options, internals.schema);
  Hoek.assert(!results.error, results.error);
  const settings = results.value;

  Glob(settings.globPattern, settings.globOptions, (err, files) => {
    Hoek.assert(!err, err);

    Async.each(files, (file, callback) => {
      const path = Path.resolve(settings.globOptions.cwd, file);
      // eslint-disable-next-line global-require
      const module = require(path);
      let util = module;
      // eslint-disable-next-line no-prototype-builtins
      if (util.hasOwnProperty('load') && typeof (module.load) === 'function') {
        util = module.load(server);
      }
      // eslint-disable-next-line no-prototype-builtins
      if (util.hasOwnProperty('utilityName')) {
        server.expose(util.utilityName, util);
        server.log(['core-config', 'plugin'], `Utility function \`${util.utilityName}\` loaded`);
      } else {
        server.log(['core-config', 'plugin'], `File \`${file}\` not ` +
                    'contains a Utility function, will be ignored');
      }
      return Hoek.nextTick(callback)();
    }, next);
  });
};


exports.register.attributes = {
  name: 'core-utility-functions',
};
