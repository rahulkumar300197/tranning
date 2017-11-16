

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
      let controller = module;
      // eslint-disable-next-line no-prototype-builtins
      if (controller.hasOwnProperty('load') && typeof (module.load) === 'function') {
        controller = module.load(server);
      }
      // eslint-disable-next-line no-prototype-builtins
      if (controller.hasOwnProperty('controllerName')) {
        server.expose(controller.controllerName, controller);
        server.log(['core-controller', 'plugin'], `Controller \`${controller.controllerName}\` loaded`);
      } else {
        server.log(['core-controller', 'plugin'], `File \`${file}\` not ` +
                    'contains a controller, will be ignored');
      }
      return Hoek.nextTick(callback)();
    }, next);
  });
};


// Defining depandancy tree ..
exports.register = function (server, options, next) {
  // eslint-disable-next-line no-shadow
  server.dependency(['bootstrap'], (server, next) => {
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
        let controller = module;
        // eslint-disable-next-line no-prototype-builtins
        if (controller.hasOwnProperty('load') && typeof (module.load) === 'function') {
          controller = module.load(server);
        }
        // eslint-disable-next-line no-prototype-builtins
        if (controller.hasOwnProperty('controllerName')) {
          server.expose(controller.controllerName, controller);
          server.log(['core-controller', 'plugin'], `Controller \`${controller.controllerName}\` loaded`);
        } else {
          server.log(['core-controller', 'plugin'], `File \`${file}\` not ` +
                        'contains a controller, will be ignored');
        }
        return Hoek.nextTick(callback)();
      }, next);
    });
  });

  next();
};


exports.register.attributes = {
  name: 'core-controller',
};
