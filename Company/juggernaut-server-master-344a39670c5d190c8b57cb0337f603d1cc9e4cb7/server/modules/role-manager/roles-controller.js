const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];

  async function getAllRoles(headers, queryData) {
    try {
      const criteria = {};
      const projection = {};
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
        lean: true,
      };
      const data = await services.MongoService.getDataAsync('Role', criteria, projection, options);
      return utilityFunctions.universalFunction.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'RoleController',
    getAllRoles,
  };
};
