const Joi = require('joi');

const internals = {};

internals.applyRoutes = function (server, next) {
  const controllers = server.plugins['core-controller'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;
  server.route([
    {
      method: 'POST',
      path: '/videoUploadStream/videoUploadS3',
      async handler(request, reply) {
        const headers = request.headers;
        const payloadData = request.payload;
        const data = await controllers.videoUploadStreamController.uploadVideoToS3(headers, payloadData);
        return reply(data);
      },
      config: {
        auth: false, // auth strategy for file upload
        description: 'Video File Upload',
        tags: ['api', 'videoUploadStream'],
        payload: {
          maxBytes: 107374182400, // maximum size file 100 GB
          output: 'file',
          parse: true,
          allow: 'multipart/form-data', // type of form data
          timeout: false,
        },
        validate: {
          headers: Joi.object({
            'content-language': Joi.string().required().description('en/ar'),
          }).unknown(),
          payload: {
            videoFile: Joi.any().meta({ swaggerType: 'file' }).required().description('video to upload'),
          },
          failAction: universalFunctions.failActionFunction, // logs in case of validation fails
        },
        plugins: {
          'hapi-swagger': {
            payloadType: 'form',
          },
        },
      },
    },
    {
      method: 'GET',
      path: '/videoUploadStream/getVideoURLs',
      async handler(request, reply) {
        const headers = request.headers;
        const queryData = request.query;
        const data = await controllers.videoUploadStreamController.getAllVideosURL(headers, queryData);
        return reply(data);
      },
      config: {
        auth: false, // auth strategy for file upload
        description: 'get video uploaded urls',
        tags: ['api', 'videoUploadStream'],
        validate: {
          headers: Joi.object({
            'content-language': Joi.string().required().description('en/ar'),
          }).unknown(),
          query: {
            limit: Joi.number().integer().optional().description('limit data in response'),
            skip: Joi.number().integer().optional().description('limit data from response'),
          },
        },
        plugins: {
          'hapi-swagger': {
            payloadType: 'form',
          },
        },
      },
    },
  ]);
  next();
};

exports.register = function (server, options, next) {
  server.dependency(['core-services', 'core-controller', 'core-models'], internals.applyRoutes);
  next();
};

exports.register.attributes = {
  name: 'videoUploadAndStream',
};
