

const Hoek = require('hoek');
const Async = require('async');
const Joi = require('joi');
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


// Defining depandancy tree ..
exports.register = function (server, options, next) {
  // eslint-disable-next-line no-shadow
  server.dependency(['bootstrap', 'core-models'], (sserver, next) => {
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
        let service = module;
        // eslint-disable-next-line no-prototype-builtins
        if (service.hasOwnProperty('load') && typeof (module.load) === 'function') {
          service = module.load(server);
        }
        // eslint-disable-next-line no-prototype-builtins
        if (service.hasOwnProperty('serviceName')) {
          server.expose(service.serviceName, service);
          server.log(['core-services', 'plugin'], `Service \`${service.serviceName}\` loaded`);
        } else {
          server.log(['core-services', 'plugin'], `File \`${file}\` not ` +
                        'contains a service, will be ignored');
        }
        return Hoek.nextTick(callback)();
      }, next);
    });
  });

  next();
};


exports.register.attributes = {
  name: 'core-services',
};
