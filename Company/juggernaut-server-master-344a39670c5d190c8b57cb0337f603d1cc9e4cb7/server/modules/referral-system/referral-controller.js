const Boom = require('boom');
const shortid = require('shortid');


const internals = {};

exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const configs = server.plugins['core-config'];
  const universalFunctions = utilityFunctions.universalFunction;

  shortid.characters(configs.ReferralConfiguration.get('/shortIDCharacters').charSet);

  async function activeReferralScheme(headers) {
    try {
      const lang = headers['content-language'];
      const criteria = {};
      const projection = {
        _id: 0,
        referralSchemeType: 1,
      };
      const options = {
        lean: true,
      };
      const scheme = await services.MongoService.getFirstMatch('AdminSetting', criteria, projection, options);
      if (!scheme.referralSchemeType) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_NOT_EXISTS' }));
      } else {
        return scheme.referralSchemeType;
      }
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function checkSingleReferral() {
    try {
      const criteria = {
        isDeleted: false,
      };
      const projection = {
        _id: 0,
        referralPattern: 1,
        noOfReferrals: 1,
        isDeleted: 1,
      };
      const options = {
        lean: true,
      };
      return services.MongoService.getDataAsync('ReferralAvailable', criteria, projection, options);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function checkRoleBasedReferral(role) {
    try {
      const criteria = {
        isDeleted: false,
        role,
      };
      const projection = {
        _id: 0,
        referralPattern: 1,
        noOfReferrals: 1,
        isDeleted: 1,
      };
      const options = {
        lean: true,
      };
      return services.MongoService.getDataAsync('ReferralAvailable', criteria, projection, options);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function checkRegionBasedReferral(coordinates) {
    try {
      const criteria = {
        isDeleted: false,
        referralApplicableLocation: {
          $geoIntersects: {
            $geometry: {
              type: 'Polygon',
              coordinates: [coordinates],
            },
          },
        },
      //  regionName: payloadData.regionName,
      };
      const projection = {
        _id: 0,
        referralPattern: 1,
        noOfReferrals: 1,
        isDeleted: 1,
      };
      const options = {
        lean: true,
      };
      return services.MongoService.getDataAsync('ReferralAvailable', criteria, projection, options);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function checkRoleAndRegionBasedReferral(payloadData) {
    try {
      const criteria = {
        isDeleted: false,
        role: payloadData.role,
        referralApplicableLocation: {
          $geoIntersects: {
            $geometry: {
              type: 'Polygon',
              coordinates: [payloadData.coordinates],
            },
          },
        },
        // regionName: payloadData.regionName,
      };
      const projection = {
        _id: 0,
        referralPattern: 1,
        noOfReferrals: 1,
        isDeleted: 1,
      };
      const options = {
        lean: true,
      };
      return services.MongoService.getDataAsync('ReferralAvailable', criteria, projection, options);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }


  /**
    * @function <b>addReferralScheme</b> <br>
    * Method to set referral scheme data
    */
  async function addReferralScheme(headers, payloadData, userData) {
    const lang = headers['content-language'];
    try {
      // checks for the valid data to be provided for referral
      if (!payloadData.instant && payloadData.waitBookingNumber <= 0) {
        throw Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'INSTANT_TRUE_CHECK' }));
      }
      if (payloadData.cashbackForOwner && payloadData.cashbackForUser && payloadData.percentageForOwner && payloadData.percentageForUser) {
        throw Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_VALIDATION_CHECK' }));
      }
      if ((payloadData.cashbackForOwner && payloadData.cashbackForOwner && payloadData.percentageForOwner)
        || (payloadData.cashbackForOwner && payloadData.cashbackForUser && payloadData.percentageForUser)
        || (payloadData.cashbackForOwner && payloadData.percentageForOwner && payloadData.percentageForUser)
        || (payloadData.cashbackForUser && payloadData.percentageForOwner && payloadData.percentageForUser)) {
        throw Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_VALIDATION_CHECK' }));
      }
      if ((payloadData.percentageForOwner) && !payloadData.operatableBookingsForOwner) {
        throw Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'OPERATABLE_BOOKING_CHECK_OWNER' }));
      }
      if ((payloadData.percentageForUser) && !payloadData.operatableBookingsForUser) {
        throw Boom.badData(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'OPERATABLE_BOOKING_CHECK_USER' }));
      }

      const criteria = {};
      const dataToSave = {};
      let schemeData;

      // check availability of referrals
      const scheme = await activeReferralScheme(headers);
      if (scheme === configs.ReferralConfiguration.get('/referralScheme', { type: 'singleReferral' })) {
        schemeData = await checkSingleReferral();
      } else if (scheme === configs.ReferralConfiguration.get('/referralScheme', { type: 'roleBasedReferral' })) {
        if (!payloadData.role) {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_ROLE_VALIDATION_CHECK' }));
        }
        schemeData = await checkRoleBasedReferral(payloadData.role);
        dataToSave.role = payloadData.role;
      } else if (scheme === configs.ReferralConfiguration.get('/referralScheme', { type: 'regionBasedReferral' })) {
        if (!payloadData.coordinates || !payloadData.regionName) {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_REGION_VALIDATION_CHECK' }));
        }
        schemeData = await checkRegionBasedReferral(payloadData.coordinates);
        dataToSave.referralApplicableLocation = {
          type: 'Polygon',
          coordinates: [payloadData.coordinates],
        };
        dataToSave.regionName = payloadData.regionName;
      } else if (scheme === configs.ReferralConfiguration.get('/referralScheme', { type: 'roleAndRegionBasedReferral' })) {
        if (!payloadData.coordinates || !payloadData.regionName || !payloadData.role) {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'ROLE_REGION_VALIDATION_CHECK' }));
        }
        schemeData = await checkRoleAndRegionBasedReferral(payloadData);
        dataToSave.role = payloadData.role;
        dataToSave.referralApplicableLocation = {
          type: 'Polygon',
          coordinates: [payloadData.coordinates],
        };
        dataToSave.regionName = payloadData.regionName;
      }
      if (schemeData && schemeData.length > 0) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_ALREADY_EXISTS' }));
      }
      dataToSave.createdByUser = userData._id;
      dataToSave.noOfReferrals = payloadData.noOfReferrals;
      dataToSave.minimumBookingPrice = payloadData.minimumBookingPrice;
      dataToSave.waitBookingNumber = payloadData.waitBookingNumber;
      dataToSave.operatableBooking = {};
      dataToSave.cashback = {};
      dataToSave.percentage = {};

      let referralPattern = `W${payloadData.waitBookingNumber}M${payloadData.minimumBookingPrice}`;
      if (payloadData.cashbackForOwner) {
        referralPattern += `OC${payloadData.cashbackForOwner}B${payloadData.operatableBookingsForOwner}`;
        dataToSave.cashback.toOwner = payloadData.cashbackForOwner;
        dataToSave.operatableBooking.toOwner = payloadData.operatableBookingsForOwner;
      }
      if (payloadData.cashbackForUser) {
        referralPattern += `UC${payloadData.cashbackForUser}B${payloadData.operatableBookingsForUser}`;
        dataToSave.cashback.toUser = payloadData.cashbackForUser;
        dataToSave.operatableBooking.toUser = payloadData.operatableBookingsForUser;
      }
      if (payloadData.percentageForOwner) {
        referralPattern += `OP${payloadData.percentageForOwner}B${payloadData.operatableBookingsForOwner}`;
        dataToSave.percentage.toOwner = payloadData.percentageForOwner;
        dataToSave.operatableBooking.toOwner = payloadData.operatableBookingsForOwner;
      }
      if (payloadData.percentageForUser) {
        referralPattern += `UP${payloadData.percentageForOwner}B${payloadData.operatableBookingsForUser}`;
        dataToSave.percentage.toUser = payloadData.percentageForUser;
        dataToSave.operatableBooking.toUser = payloadData.operatableBookingsForUser;
      }
      if (payloadData.isAfterBooking) {
        referralPattern += 'A';
        dataToSave.isAppliedAfterBooking = payloadData.isAfterBooking;
      }
      criteria.referralPattern = referralPattern;
      dataToSave.referralPattern = referralPattern;
      dataToSave.isDeleted = false;
      const options = {
        new: true,
        upsert: true,
      };
      const result = await services.MongoService.updateData('ReferralAvailable', criteria, dataToSave, options);
      return universalFunctions.sendSuccess(headers, result);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function deleteScheme(headers, payloadData, userData) {
    try {
      const criteria = {
        referralPattern: payloadData.referralPattern,
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
      const result = await services.MongoService.updateData('ReferralAvailable', criteria, dataToSave, options);
      if (!result) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_PATTERN_VALIDATION_CHECK' }));
      }
      return universalFunctions.sendSuccess(headers, result);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getAllScheme(headers, queryData) {
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
        services.MongoService.countData('ReferralAvailable', criteria),
        services.MongoService.getDataAsync('ReferralAvailable', criteria, projection, options),
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

  async function disableOldReferralPatterns() {
    try {
      const criteria = {};
      const dataToUpdate = {
        isDeleted: true,
      };
      const options = {
        multi: true,
      };
      return await services.MongoService.updateMultiple('ReferralAvailable', criteria, dataToUpdate, options);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function addReferralSchemeType(headers, payloadData) {
    try {
      const criteria = {
        referralSchemeType: payloadData.referralSchemeType,
      };
      const projection = {
        _id: 0,
        referralSchemeType: 1,
      };
      const options = {
        lean: true,
        new: true,
      };
      const scheme = await services.MongoService.getFirstMatch('AdminSetting', criteria, projection, options);
      if (scheme) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'REFERRAL_ALREADY_EXISTS' }));
      }
      const updateCriteria = {};
      const dataToUpdate = {
        referralSchemeType: payloadData.referralSchemeType,
      };
      const updateScheme = await services.MongoService.updateData('AdminSetting', updateCriteria, dataToUpdate, options);
      disableOldReferralPatterns();
      return universalFunctions.sendSuccess(headers, updateScheme);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function applyReferral(headers, pattern, userID) {
    try {
      let userBenifit;
      let ownerBenifit;
      const cashToOwner = pattern.substring(pattern.indexOf('OC') + 2, pattern.indexOf('B'));
      const cashToUser = pattern.substring(pattern.indexOf('UC') + 2, pattern.lastIndexOf('B'));
      const percentageToOwner = pattern.substring(pattern.indexOf('OP') + 2, pattern.indexOf('B'));
      const percentageToUser = pattern.substring(pattern.indexOf('UP') + 2, pattern.lastIndexOf('B'));
      if (pattern.match(/B0/g)) {
        userBenifit = {
          $inc: {
            cash: cashToUser,
          },
          $push: {
            referralBenifits: {
              cashback: cashToUser,
              operatableBooking: 0,
              isReferralCredited: true,
            },
          },
        };
        ownerBenifit = {
          $inc: {
            cash: cashToOwner,
          },
          $push: {
            referralBenifits: {
              cashback: cashToOwner,
              operatableBooking: 0,
              referredTo: userID,
              isReferralCredited: true,
            },
          },
        };
      } else {
        let opBookingToOwner = pattern.substring(pattern.indexOf('B') + 1);
        opBookingToOwner = opBookingToOwner.substring(0, opBookingToOwner.search(/[A-Z]/));
        let opBookingToUser = pattern.substring(pattern.indexOf('B') + 1);
        opBookingToUser = opBookingToUser.substring(0, opBookingToUser.search(/[A-Z]/));
        let waitBookingNumber = pattern.substring(pattern.indexOf('W') + 1);
        waitBookingNumber = waitBookingNumber.substring(0, waitBookingNumber.search(/[A-Z]/));
        let minimumBookingPrice = pattern.substring(pattern.indexOf('M') + 1);
        minimumBookingPrice = minimumBookingPrice.substring(0, minimumBookingPrice.search(/[A-Z]/));
        ownerBenifit = {
          $push: {
            referralBenifits: {
              cashback: cashToOwner,
              percentage: pattern.match('P') ? percentageToOwner : null,
              minimumBookingPrice,
              waitBookingNumber,
              operatableBooking: opBookingToOwner,
              isAppliedAfterBooking: !!pattern.match('A'),
              referredTo: userID,
            },
          },
        };
        userBenifit = {
          $push: {
            referralBenifits: {
              cashback: cashToUser,
              percentage: pattern.match('P') ? percentageToUser : null,
              minimumBookingPrice,
              waitBookingNumber,
              operatableBooking: opBookingToUser,
              isAppliedAfterBooking: !!pattern.match('A'),
            },
          },
        };
      }
      return [ownerBenifit, userBenifit];
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  /**
     * @function <b>addUserReferral</b><br> referral generation during register
     * @param {object} referralUsageData     referral usage data
     */


  async function addUserReferral(headers, userID, userRole, payloadData) {
    try {
      let referralPatternData = {};
      const options = {
        lean: true,
        upsert: true,
      };
      let referralSchemeType = await services.MongoService.getFirstMatch('AdminSetting', {}, { referralSchemeType: 1 }, options);
      referralSchemeType = referralSchemeType.referralSchemeType;
      if (referralSchemeType === configs.ReferralConfiguration.get('/referralScheme', { type: 'singleReferral' })) {
        referralPatternData = await checkSingleReferral();
      } else if (referralSchemeType === configs.ReferralConfiguration.get('/referralScheme', { type: 'roleBasedReferral' })) {
        referralPatternData = await checkRoleBasedReferral(userRole);
      } else if (referralSchemeType === configs.ReferralConfiguration.get('/referralScheme', { type: 'regionBasedReferral' })) {
        if (payloadData.latitude !== undefined && payloadData.longitude !== undefined) {
          const criteria = {
            referralApplicableLocation: {
              $geoIntersects:
                {
                  $geometry: {
                    type: 'Point',
                    coordinates: [payloadData.latitude, payloadData.longitude],
                  },
                },
            },
            isDeleted: false,
          };
          const projection = {
            _id: 0,
            referralPattern: 1,
            noOfReferrals: 1,
          };
          referralPatternData = await services.MongoService.getDataAsync('ReferralAvailable', criteria, projection, {});
        }
      } else if (referralSchemeType === configs.ReferralConfiguration.get('/referralScheme', { type: 'roleAndRegionBasedReferral' })) {
        const criteria = {
          referralApplicableLocation: {
            $geoIntersects:
             {
               $geometry: {
                 type: 'Point',
                 coordinates: [payloadData.longitude, payloadData.latitude],
               },
             },
          },
          role: userRole,
          isDeleted: false,
        };
        const projection = {
          _id: 0,
          referralPattern: 1,
          noOfReferrals: 1,
        };
        referralPatternData = await services.MongoService.getDataAsync('ReferralAvailable', criteria, projection, {});
      }
      if (referralPatternData.length > 0) {
        const referralData = {
          referralPattern: referralPatternData[0].referralPattern,
          noOfReferrals: referralPatternData[0].noOfReferrals,
          referralCodeUsed: payloadData.referralCode,
          referralCode: shortid.generate(),
          user: userID,

        };
        await services.MongoService.createData('ReferralUsage', referralData);
      }

      // check referral code benifit
      if (payloadData.referralCode) {
        const increment = {
          $inc: {
            noOfReferralsUsed: 1,
          },
        };
        const owner = await services.MongoService.updateData('ReferralUsage', { referralCode: payloadData.referralCode }, increment, options);
        const data = await applyReferral(headers, owner.referralPattern, userID);
        services.MongoService.updateData('UserWallet', { user: owner.user }, data[0], options);
        services.MongoService.updateData('UserWallet', { user: userID }, data[1], options);
      }
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  async function checkReferralBenifits(headers, userData) {
    try {
      const criteria = {
        user: userData._id,
      };
      const options = {
        lean: true,
      };
      const data = await services.MongoService.getFirstMatch('UserWallet', criteria, { referralBenifits: 1 }, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }


  return {
    controllerName: 'ReferralController',
    addReferralSchemeType,
    addReferralScheme,
    deleteScheme,
    getAllScheme,
    activeReferralScheme,
    disableOldReferralPatterns,
    checkSingleReferral,
    checkRoleBasedReferral,
    checkRegionBasedReferral,
    checkRoleAndRegionBasedReferral,
    addUserReferral,
    checkReferralBenifits,
  };
};
