const Hoek = require('hoek');
const Joi = require('joi');
const Async = require('async');
const Path = require('path');
const Glob = require('glob');

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
      let config = module;
      // eslint-disable-next-line no-prototype-builtins
      if (config.hasOwnProperty('load') && typeof (module.load) === 'function') {
        config = module.load(server);
      }
      // eslint-disable-next-line no-prototype-builtins
      if (config.hasOwnProperty('configurationName')) {
        server.expose(config.configurationName, config);
        server.log(['core-config', 'plugin'], `Service \`${config.configurationName}\` loaded`);
      } else {
        server.log(['core-config', 'plugin'], `File \`${file}\` not ` +
                    'contains a configuration, will be ignored');
      }
      return Hoek.nextTick(callback)();
    }, next);
  });
};


exports.register.attributes = {
  name: 'core-config',
};
