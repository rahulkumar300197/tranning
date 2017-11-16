const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  async function addCategoryAvailLocation(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      if (payloadData.coordinates) {
        payloadData.geoLocation = {
          type: 'Polygon',
          coordinates: [payloadData.coordinates],
        };
      } else {
        payloadData.geoLocation = {
          type: 'Polygon',
          coordinates: [[[0, 0], [0.000001, 0.000001], [0.000002, 0.000002], [0, 0]]],
        };
      }
      const data = await services.MongoService.createData('CategoryLocation', payloadData);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'ALREADY_EXIST' }));
    }
  }

  // check location and category co

  async function checkCatExist(payloadData) {
    try {
      const criteria = {
        _id: payloadData.categoryID,
        isDeleted: false,
      };
      const projections = {};
      const options = {
        lean: true,
      };
      return services.MongoService.getFirstMatch('Category', criteria, projections, options);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function preValidationChecks(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const categoryData = await checkCatExist(payloadData);
      if (categoryData.length < 1) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CATEGORY_NOT_EXIST' }));
      }
      if (!categoryData.categoryExists[0].parentID) {
        return universalFunctions.sendSuccess(headers, null);
      }
      const criteria = {
        categoryID: results.categoryExists[0].parentID,
      };
      if (payloadData.coordinates) {
        criteria.geoLocation = {
          $geoIntersects: {
            $geometry: {
              type: 'Polygon',
              coordinates: [payloadData.coordinates],
            },
          },
        };
      }
      const projections = {};
      const options = {
        lean: true,
      };
      const data = services.MongoService.getDataAsync('CategoryLocation', criteria, projections, options);
      if (data.length < 1) {
        throw Boom.rangeNotSatisfiable(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CATEGORY_RANGE' }));
      }
      return;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function listAllCategoryLocations(headers, queryData) {
    try {
      const criteria = {};
      if (queryData.parentID) {
        criteria.parentID = queryData.parentID;
      }
      const projections = {};
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
        lean: true,
      };
      const data = await services.MongoService.getDataAsync('CategoryLocation', criteria, projections, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function listAllCategoriesInRange(headers, queryData) {
    try {
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
        lean: true,
      };
      const criteria = {
        geoLocation:
        {
          $geoIntersects:
          {
            $geometry: {
              type: 'Point',
              coordinates: queryData.coordinates,
            },
          },
        },
      };
      if (queryData.parentID) {
        criteria.parentID = queryData.parentID;
      }
      const projections = {
        categoryID: 1,
        _id: 0,
      };
      const result = await services.MongoService.getDataAsync('CategoryLocation', criteria, projections, {});
      const categoryID = [];
      result.forEach((id) => {
        categoryID.push(id.categoryID);
      });
      const newcriteria = {};
      newcriteria._id = {
        $in: categoryID,
      };
      newcriteria.isDeleted = false;
      const data = await services.MongoService.getDataAsync('Category', newcriteria, {}, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function preValidationServiceChecks(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const criteria = {
        _id: payloadData.serviceID,
        isDeleted: false,
      };
      const projections = {};
      const options = {
        lean: true,
      };
      const results = await services.MongoService.getDataAsync('Service', criteria, projections, options);
      if (results.length < 1) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_NOT_AVAILABLE' }));
      }
      if (!results.serviceExists[0].parentID) {
        return universalFunctions.sendSuccess(headers, null);
      }
      const categoryCriteria = {
        categoryID: results.categoryExists[0].parentID,
      };
      if (payloadData.coordinates) {
        criteria.geoLocation = {
          $geoIntersects: {
            $geometry: {
              type: 'Polygon',
              coordinates: [payloadData.coordinates],
            },
          },
        };
      }
      const categoryOptions = {
        lean: true,
      };
      const data = await services.MongoService.getDataAsync('CategoryLocation', categoryCriteria, projections, categoryOptions);
      if (data.length < 1) {
        throw Boom.rangeNotSatisfiable(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_RANGE' }));
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function addServiceAvailLocation(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      if (payloadData.coordinates) {
        payloadData.geoLocation = {
          type: 'Polygon',
          coordinates: [payloadData.coordinates],
        };
      } else {
        payloadData.geoLocation = {
          type: 'Polygon',
          coordinates: [[[0, 0], [0.000001, 0.000001], [0.000002, 0.000002], [0, 0]]],
        };
      }
      const data = await services.MongoService.createData('CategoryLocation', payloadData);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'ALREADY_EXIST' }));
    }
  }

  async function listAllServicesLocations(headers, queryData) {
    try {
      const criteria = {};
      if (queryData.parentID) {
        criteria.parentID = queryData.parentID;
      }
      const projections = {};

      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
        lean: true,
      };
      const data = await services.MongoService.getDataAsync('CategoryLocation', criteria, projections, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function listAllServicesInRange(headers, queryData) {
    try {
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
        lean: true,
      };
      const criteria = {
        // searchCityFirst: false,
        geoLocation:
        {
          $geoIntersects:
          {
            $geometry: {
              type: 'Point',
              coordinates: queryData.coordinates,
            },
          },
        },
      };
      if (queryData.parentID) {
        criteria.parentID = queryData.parentID;
      }
      const projections = {
        serviceID: 1,
        _id: 0,
      };
      const result = await services.MongoService.getDataAsync('CategoryLocation', criteria, projections, {});
      const servicesID = [];
      result.forEach((id) => {
        // let update = id && id.serviceID || null
        servicesID.push(id.serviceID);
      });
      const newcriteria = {};
      newcriteria._id = {
        $in: servicesID,
      };
      newcriteria.isDeleted = false;
      const data = await services.MongoService.getDataAsync('Service', newcriteria, {}, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'MatchingController',
    addCategoryAvailLocation,
    preValidationChecks,
    listAllCategoryLocations,
    listAllCategoriesInRange,
    preValidationServiceChecks,
    addServiceAvailLocation,
    listAllServicesLocations,
    listAllServicesInRange,
  };
};
