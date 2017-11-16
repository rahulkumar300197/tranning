const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];

  async function giveReviewRating(headers, payloadData, userData) {
    try {
      const criteria = {
        $and: [{
          $or: [
            { customer: userData.userID },
            { driver: userData.userID },
            { serviceProvider: userData.userID },
          ],
        }, {
          $or: [
            { customer: payloadData.userID },
            { driver: payloadData.userID },
            { serviceProvider: payloadData.userID },
          ],
        },
        ],

        // todo add booking status to not complete
      };
      const validateUser = await services.MongoService.countData('Booking', criteria);
      if (validateUser < 1) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', {
          locale: headers['content-language'],
          message: 'DOES_NOT_BELONG_TO_BOOKING',
        }));
      }
      // todo remove review,rating to get the single review of user for particular booking and user
      const dataToSave = {
        reviewBy: userData.userID,
        reviewed: payloadData.userID,
        bookingID: payloadData.bookingID,
        review: payloadData.review,
        rating: payloadData.rating,
      };
      const validateRating = await services.MongoService.countData('Review', dataToSave);
      if (validateRating > 0) {
        throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: headers['content-language'], message: 'ALREADY_RATED' }));
      } else {
        const data = await services.MongoService.createData('Review', dataToSave);
        const userCriteria = {
          _id: payloadData.userID,
        };
        const update = {
          $inc: {
            totalRatingPoints: payloadData.rating,
            ratedByUserCount: 1,
          },
        };
        services.MongoService.updateData('User', userCriteria, update, {});
        return utilityFunctions.universalFunction.sendSuccess(headers, data);
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function listDetailedReview(headers, queryData, userData) {
    try {
      const criteria = {};
      if (queryData.userID && queryData.bookingID) {
        criteria.reviewed = queryData.userID;
        criteria.bookingID = queryData.bookingID;
      } else if (queryData.bookingID) {
        criteria.bookingID = queryData.bookingID;
      } else if (queryData.userID) {
        criteria.reviewed = queryData.userID;
      }

      if (queryData.showOnlyMyReviws) {
        criteria.reviewBy = userData.userID;
      }
      const projection = {};
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
      };
      const data = await services.MongoService.getDataAsync('Review', criteria, projection, options);
      return utilityFunctions.universalFunction.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function listAverageRating(headers, queryData) {
    try {
      const criteria = {};
      if (queryData.userID) {
        criteria._id = queryData.userID;
      }
      criteria.ratedByUserCount = {
        $gt: 0,
      };
      const projection = {
        totalRatingPoints: 1,
        ratedByUserCount: 1,
      };
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
      };
      const users = [];
      const data = await services.MongoService.getDataAsync('User', criteria, projection, options);
      for (let index = 0; index < data.length; index += 1) {
        const userRating = {
          _id: data[index]._id,
          averageRating: (data[index].totalRatingPoints / data[index].ratedByUserCount),
        };
        users.push(userRating);
      }
      return utilityFunctions.universalFunction.sendSuccess(headers, users);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'ReviewController',
    giveReviewRating,
    listDetailedReview,
    listAverageRating,
  };
};
