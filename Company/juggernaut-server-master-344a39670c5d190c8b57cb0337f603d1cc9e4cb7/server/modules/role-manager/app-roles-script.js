const internals = {};

internals.initilize = function (server, next) {
  const services = server.plugins['core-services'];
  async function initlizeRole() {
    const arr = [{ role: 'customer', createdBy: null },
      { role: 'admin', createdBy: null },
      { role: 'driver', createdBy: null },
      { role: 'serviceProvider', createdBy: null }];
    arr.forEach((element) => {
      const criteria = {
        role: element.role,
      };
      const options = {
        new: true,
        upsert: true,
      };
      services.MongoService.updateData('Role', criteria, element, options);
    }, this);
  }
  initlizeRole();
  next();
};

// Defining depandancy tree ..
exports.register = function (server, options, next) {
  server.dependency(['auth', 'core-services', 'core-models'], internals.initilize);
  next();
};

exports.register.attributes = {
  name: 'app-roles-script',
};
