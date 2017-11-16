const videoConstants = require('./video-upload-stream-constants');
const awsCredentials = require('./aws-credentials');
const Boom = require('boom');
const fs = require('fs');
const AWS = require('aws-sdk');
const s3UploadStream = P.promisifyAll(require('s3-upload-stream'));

const internals = {};

exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  // upload video to S3 bucket and inserts details in DB
  async function uploadVideoToS3(headers, payloadData) {
    return new Promise((resolve, reject) => {
      if (payloadData.videoFile.path) {
        let filename = payloadData.videoFile;
        filename = utilityFunctions.universalFunction.urlGenerator(filename);
        // configration settings for AWS
        AWS.config.update({
          accessKeyId: awsCredentials.accessKeyId,
          signatureVersion: awsCredentials.signatureVersion,
          secretAccessKey: awsCredentials.secretAccessKey,
        });
        // uploads video in stream to S3 bucket
        const s3Stream = s3UploadStream(new AWS.S3());

        // reads video
        const read = fs.createReadStream(payloadData.videoFile.path);

        const upload = s3Stream.upload({
          Bucket: awsCredentials.s3Bucket.BucketName, // S3 bucket name
          Key: filename, // name of file to be stored in bucket
          ACL: awsCredentials.s3Bucket.ACL, // access rights for the video
          ContentType: awsCredentials.s3Bucket.ContentType, // type of video
        });

        upload.maxPartSize(videoConstants.videoPartMaxSize); // maximum size of the part to upload
        upload.concurrentParts(videoConstants.concurrentParts); // number of parallel uploads

        // eslint-disable-next-line no-unused-vars
        upload.on('error', (error) => {
          reject(error);
        });

        // Handle progress
        upload.on('part', (details) => { // eslint-disable-line no-unused-vars
          // allowing you to create a progress bar
        });
        // Handle upload completion
        upload.on('uploaded', async (details) => {
          const videoDetails = {
            videoName: details.Key,
            videoS3BucketURL: details.Location,
            videoCloudFrontURL: awsCredentials.cloudFrontDomainName + details.Key,
          };
          const modelName = videoConstants.videoModelName;
          const data = await services.MongoService.createData(modelName, videoDetails);
          const response = utilityFunctions.universalFunction.sendSuccess(headers, data);
          resolve(response);
        });
        read.pipe(upload);
      } else {
        reject(Boom.badRequest());
      }
    });
  }

  // get details of all videos uploaded
  async function getAllVideosURL(headers, queryData) {
    try {
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip,
      };
      const data = await services.MongoService.getDataAsync(videoConstants.videoModelName, {}, {}, options);
      return utilityFunctions.universalFunction.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'videoUploadStreamController',
    uploadVideoToS3,
    getAllVideosURL,
  };
};

