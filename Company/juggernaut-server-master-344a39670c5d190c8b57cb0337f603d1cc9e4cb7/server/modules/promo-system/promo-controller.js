const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const configs = server.plugins['core-config'];
  const universalFunctions = utilityFunctions.universalFunction;
  /**
    * @function <b>addReferralScheme</b> <br>
    * Method to set referral scheme data
    */
  async function addPromoScheme(headers, payloadData, userData) {
    const lang = headers['content-language'];
    try {
      // checks for the valid data to be provided for referral
      if (payloadData.cashback && payloadData.percentage) {
        throw Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'PROMO_ONLY_ONE_CASHBACK_PERCENTAGE' }));
      }

      let criteria = {};
      const dataToSave = payloadData;
      dataToSave.createdByUser = userData._id;
      let promoPattern = 'P';
      if (payloadData.cashback) {
        promoPattern += `C${payloadData.cashback}`;
      }
      if (payloadData.percentage) {
        promoPattern += `P${payloadData.percentage}`;
      }
      if (payloadData.maxCashback) {
        promoPattern += `MC${payloadData.maxCashback}`;
      }

      criteria = {
        $or: [
          { promoPattern },
          { alias: payloadData.alias },
        ],
      };
      const count = await services.MongoService.countData('Promo', criteria);
      if (count > 0) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'PROMO_ALREADY_EXIST' }));
      }
      dataToSave.promoPattern = promoPattern;
      dataToSave.isDeleted = false;
      if (payloadData.coordinates) {
        dataToSave.promoApplicableLocation = {
          type: 'Polygon',
          coordinates: [payloadData.coordinates],
        };
      }
      const result = await services.MongoService.createData('Promo', dataToSave);
      return universalFunctions.sendSuccess(headers, result);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function deletePromo(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        promoPattern: payloadData.promoPattern,
      };
      if (userData.role !== configs.UserConfiguration.get('/roles', { role: 'admin' })) {
        criteria.createByUser = userData.userID;
      }
      const dataToSave = {
        isDeleted: true,
      };
      const options = {
        new: true,
      };
      const result = await services.MongoService.updateData('Promo', criteria, dataToSave, options);
      if (!result) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'PROMO_DELETE_NOT_ALLOWED' }));
      }
      return universalFunctions.sendSuccess(headers, result);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getAllPromo(headers, queryData) {
    try {
      const criteria = {};
      if (queryData.createdByUser) {
        criteria.createdByUser = queryData.createdByUser;
      }
      if (queryData.isDeleted) {
        criteria.isDeleted = true;
      } else if (queryData.isDeleted === false) {
        criteria.isDeleted = false;
      }
      const projection = {};
      const options = {
        lean: true,
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
      };
      const promise = Promise.all([
        services.MongoService.countData('Promo', criteria),
        services.MongoService.getDataAsync('Promo', criteria, projection, options),
      ]);
      const data = await promise;
      const result = {
        count: data[0],
        data: data[1],
      };
      return universalFunctions.sendSuccess(headers, result);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function fetchSinglePromo() {
    try {
      const criteria = {
        promoSchemeType: configs.PromoConfiguration.get('/promoScheme', { type: 'promoForAllUsers' }),
        isDeleted: false,
      };
      const projection = {
        alias: 1,
        _id: 0,
      };
      const options = {
        lean: true,
      };
      const result = await services.MongoService.getDataAsync('Promo', criteria, projection, options);
      if (result.length > 0) {
        return result[0];
      }
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function fetchRoleBasedPromo(userData) {
    try {
      const criteria = {
        promoSchemeType: configs.PromoConfiguration.get('/promoScheme', { type: 'roleSpecificPromo' }),
        isDeleted: false,
        role: userData.role,
      };
      const projection = {
        alias: 1,
        _id: 0,
      };
      const options = {
        lean: true,
      };
      const result = await services.MongoService.getDataAsync('Promo', criteria, projection, options);
      if (result.length > 0) {
        return result[0];
      }
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function fetchRegionBasedPromo(queryData) {
    try {
      const criteria = {
        promoSchemeType: configs.PromoConfiguration.get('/promoScheme', { type: 'regionSpecificPromo' }),
        isDeleted: false,
        promoApplicableLocation: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: queryData.coordinates,
            },
          },
        },
      };
      const projection = {
        alias: 1,
        _id: 0,
      };
      const options = {
        lean: true,
      };
      const result = await services.MongoService.getDataAsync('Promo', criteria, projection, options);
      if (result.length > 0) {
        return result[0];
      }
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function fetchRoleAndRegionBasedPromo(queryData, userData) {
    try {
      const criteria = {
        promoSchemeType: configs.PromoConfiguration.get('/promoScheme', { type: 'roleAndRegionSpecificPromo' }),
        isDeleted: false,
        role: userData.role,
        promoApplicableLocation: {
          $geoIntersects: {
            $geometry: {
              type: 'Point',
              coordinates: queryData.coordinates,
            },
          },
        },
      };
      const projection = {
        alias: 1,
        _id: 0,
      };
      const options = {
        lean: true,
      };
      const result = await services.MongoService.getDataAsync('Promo', criteria, projection, options);

      if (result.length > 0) {
        return result[0];
      }
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function getAllUserPromo(headers, queryData, userData) {
    try {
      const data = [];
      const promise = await Promise.all([
        fetchSinglePromo(),
        fetchRoleBasedPromo(userData),
        fetchRegionBasedPromo(queryData),
        fetchRoleAndRegionBasedPromo(queryData, userData),
      ]);
      for (let i = 0; i < promise.length; i += 1) {
        if (promise[i] !== null && promise[i] !== undefined) {
          data.push(promise[i]);
        }
      }
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function specificPromoDetails(headers, queryData) {
    try {
      const criteria = {
        alias: queryData.alias,
      };
      const projection = {
        minimumBookingPrice: 1,
        cashback: 1,
        percentage: 1,
        maxCashback: 1,
        alias: 1,
        individualUserPromoAttempt: 1,
        _id: 0,
      };
      const options = {
        lean: true,
      };
      const result = await services.MongoService.getFirstMatch('Promo', criteria, projection, options);
      return universalFunctions.sendSuccess(headers, result);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  return {
    controllerName: 'PromoController',
    addPromoScheme,
    deletePromo,
    getAllPromo,
    getAllUserPromo,
    specificPromoDetails,
  };
};
