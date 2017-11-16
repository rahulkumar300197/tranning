const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
       * @function <b>likeorUnlikeComment</b><br> Method to like or unlike comment
       * @param {Object} comment  Object Containing commentID
       * @param {object} like object containg user,commentID,likelevel
       * @param {Function} callback   callback Function
       */

  async function likeOrUnlikeComment(headers, payloadData, userData) {
    try {
      const user = userData;
      const lang = headers['content-language'];
      const like = payloadData;
      const comment = like.commentID;
      delete like.commentID;
      const setCriteria = {
        likedOnComment: comment,
        user,
      };
      const result = await services.MongoService.getDataAsync('Like', setCriteria, {}, {});
      if (result.length > 0) {
        if (result[0].likeLevel !== like.likeLevel) {
          const likeLevel = {
            likeLevel: like.likeLevel,
          };
          const options = {
            new: true,
          };
          const data = await services.MongoService.updateData('Like', setCriteria, likeLevel, options);
          return universalFunctions.sendSuccess(headers, data);
        }
        const data = await services.MongoService.deleteData('Like', setCriteria);// eslint-disable-line no-unused-vars
        return (headers, configs.MessageConfiguration.get('/lang', { locale: lang, message: 'UNLIKED' }));
      }
      const setQuery = {
        likedOnComment: comment,
        user,
        likeLevel: like.likeLevel,
      };
      const data = await services.MongoService.createData('Like', setQuery);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'LikeController',
    likeOrUnlikeComment,
  };
};
