const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const mongoose = server.plugins.bootstrap.mongoose;
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
   * @function <b>addTestEntity</b><br> Create new Entity for testing purpose
   * @param {Object} entityData   Object Containing entitytext
   * @param {Function} callback   callback Function
   */
  async function addTestEntity(headers, payloadData) {
    try {
      const data = await services.MongoService.createData('Entity', payloadData);
      if (data) {
        return data;
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }
  /**
   * @function <b>addcomment</b> Add comment to the Entity
   * @param {Object} parentcomment   Object Containing uppercommentid
   * @param {object} comment object containing user,uppercommentid,commenttext,entity
   * @param {Function} callback   callback Function
   */
  async function addComment(headers, comment, userData) {
    try {
      const parentComment = {
        _id: comment.upperCommentID,
      };
      comment.user = userData;
      if (parentComment._id) {
        parentComment.entityID = comment.entityID;
        const data = await services.MongoService.getDataAsync('Comment', parentComment, {}, {});
        if (data.length > 0) {
          comment.commentLevel = data[0].commentLevel + 1;
          const data1 = await services.MongoService.createData('Comment', comment);
          return universalFunctions.sendSuccess(headers, data1);
        }
        const data2 = await services.MongoService.createData('Comment', comment);
        return universalFunctions.sendSuccess(headers, data2);
      }
      const data = await services.MongoService.createData('Comment', comment);
      if (data) {
        return universalFunctions.sendSuccess(headers, data);
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>getAllComment</b> get comments on entity
   * @param {Object} entity   Object Containing entity,limit,skip
   * @param {Function} callback   callback Function
   */
  async function getAllComment(headers, payloadData) {
    try {
      const entity = payloadData;
      const lang = headers['content-language'];
      const data = [{
        $match: {
          entityID: new mongoose.Types.ObjectId(entity.entityID),
          commentLevel: 0,
        },
      },
      {
        $skip: entity.skip || 0,
      },
      {
        $limit: entity.limit || configs.AppConfiguration.get('/DATABASE', {
          DATABASE: 'LIMIT',
        }),
      },
      {
        $sort: {
          createdAt: 1,
        },
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'likedOnComment',
          as: 'likedBy',
        },
      },
      ];
      const result = await services.MongoService.aggregateData('Comment', data);
      if (result.length > 0) {
        const countCriteria = [{
          $match: {
            entityID: new mongoose.Types.ObjectId(entity.entityID),
            commentLevel: 0,
          },
        },
        {
          $group: {
            _id: null,
            count: {
              $sum: 1,
            },
          },
        },
        ];
        const countResult = await services.MongoService.aggregateData('Comment', countCriteria);
        let totalCount = {};
        if (countResult) {
          totalCount = {
            totalCount: countResult[0].count,
          };
        } else if (countResult.length === 0) {
          totalCount = {
            totalCount: 0,
          };
        }
        const comments = [];
        comments.push(totalCount);
        comments.push(result);
        return universalFunctions.sendSuccess(headers, comments);
      }

      throw Boom.notFound(configs.MessageConfiguration.get('/lang', {
        locale: lang,
        message: 'COMMENT_NOT_FOUND',
      }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>getReplyComment</b> get comments on entity
   * @param {Object} entity   Object Containing entity,parentcomment,limit,skip
   * @param {Function} callback   callback Function
   */
  async function getReplyOnComment(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const entity = payloadData;
      const replyData = [{
        $match: {
          entityID: new mongoose.Types.ObjectId(entity.entityID),
          upperCommentID: new mongoose.Types.ObjectId(entity.parentCommentID),
          commentLevel: entity.commentLevel,
        },
      },
      {
        $skip: entity.skip || 0,
      },
      {
        $limit: entity.limit || configs.AppConfiguration.get('/DATABASE', {
          DATABASE: 'LIMIT',
        }),
      },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'likedOnComment',
          as: 'likedBy',
        },
      },
      ];
      const data = await services.MongoService.aggregateData('Comment', replyData);
      if (data.length > 0) {
        const countCriteria = [{
          $match: {
            entityID: new mongoose.Types.ObjectId(entity.entityID),
            upperCommentID: new mongoose.Types.ObjectId(entity.parentCommentID),
          },
        },
        {
          $group: {
            _id: null,
            count: {
              $sum: 1,
            },
          },
        },
        ];
        const countResult = await services.MongoService.aggregateData('Comment', countCriteria);
        if (countResult) {
          let totalCount = {};
          if (countResult.length > 0) {
            totalCount = {
              totalCount: countResult[0].count,
            };
          } else {
            totalCount = {
              totalCount: 0,
            };
          }

          const comments = [];
          comments.push(totalCount);
          comments.push(data);
          return universalFunctions.sendSuccess(headers, comments);
        }

        return Boom.notFound(configs.MessageConfiguration.get('/lang', {
          locale: lang,
          message: 'COMMENT_NOT_FOUND',
        }));
      }
      return Boom.notFound(configs.MessageConfiguration.get('/lang', {
        locale: lang,
        message: 'COMMENT_NOT_FOUND',
      }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }
  /**
   * @function <b>deleteComment</b> delete comment
   * @param {Object} entity   Object Containing entity,commentid
   * @param {Function} callback   callback Function
   */
  async function deleteComment(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const entity = payloadData;
      const criteria = {
        $or: [{
          _id: entity.commentID,
          entityID: entity.entityID,
        },
        {
          upperCommentID: entity.commentID,
          entityID: entity.entityID,
        },
        ],
      };
      const data = await services.MongoService.deleteMany('Comment', criteria);
      if (data.deletedCount) {
        return (headers, configs.MessageConfiguration.get('/lang', {
          locale: lang,
          message: 'DELETED',
        }));
      }
      return Boom.notFound(configs.MessageConfiguration.get('/lang', {
        locale: lang,
        message: 'COMMENT_NOT_FOUND',
      }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'CommentController',
    addTestEntity,
    addComment,
    getAllComment,
    getReplyOnComment,
    deleteComment,
  };
};
