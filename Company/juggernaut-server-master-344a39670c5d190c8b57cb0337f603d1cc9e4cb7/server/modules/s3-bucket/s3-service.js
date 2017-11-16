const Path = require('path');
const fsExtra = P.promisifyAll(require('fs-extra'));
const fs = P.promisifyAll(require('fs'));
const Boom = require('boom');
const gm = require('gm');
global.AWS = require('aws-sdk');

AWS.config.setPromisesDependency(P);

const internals = {};

// internals.applyFunctions = function (server, next) {
exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const utilityFunctions = server.plugins['core-utility-functions'];

  AWS.config.update({
    accessKeyId: configs.S3BucketConfig.get('/s3BucketCredentials/accessKeyId'),
    secretAccessKey: configs.S3BucketConfig.get('/s3BucketCredentials/secretAccessKey'),
    region: configs.S3BucketConfig.get('/s3BucketCredentials/region'),
  });

  const s3 = new AWS.S3({
    params: { Bucket: configs.S3BucketConfig.get('/s3BucketCredentials/bucket') },
  });

  async function saveFile(fileData, path) {
    return fsExtra.copyAsync(fileData, path);
  }

  /*
   Create thumbnail image using graphics magick
   */

  function createThumbnailImage(originalPath, thumbnailPath) {
    const length = configs.S3BucketConfig.get('/thumbnailSize/length');
    const width = configs.S3BucketConfig.get('/thumbnailSize/width');
    const thumbnail = gm.subClass({ imageMagick: true });
    return new Promise(((resolve, reject) => {
      try {
        thumbnail(originalPath)
          .resize(length, width, '!')
          .autoOrient()
          .write(thumbnailPath, (err) => {
            if (err) {
              winstonLogger.error(err);
              reject(err);
            }
            resolve();
          });
      } catch (error) {
        winstonLogger.error(error);
        reject(error);
      }
    }));
  }


  async function parallelUploadTOS3(filesArray) {
    // Create S3 Client
    try {
      const taskToUploadInParallel = [];
      const userFolder = configs.S3BucketConfig.get('/s3BucketCredentials/folder/user');
      await P.mapSeries(filesArray, async (fileData) => {
        const s3JSON = {
          Key: `${process.env.NODE_ENV}/${userFolder}/${fileData.nameToSave}`,
          ContentType: fileData.contentType,
          Body: fileData.originalPath,
          ACL: 'public-read',
        };
        await s3.putObject(s3JSON).promise();
        const imageURL = `https://s3.us-west-2.amazonaws.com/${configs.S3BucketConfig.get('/s3BucketCredentials/bucket')}/${process.env.NODE_ENV}/${userFolder}/${fileData.nameToSave}`;
        taskToUploadInParallel.push(imageURL);
        await fs.unlinkAsync(`${Path.resolve('.')}/uploads/${fileData.nameToSave}`);
      });

      return taskToUploadInParallel;
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  /**
   * @function <b>uploadFileToS3WithThumbnail</b><br> Method to upload Files with Thumbnail
   * @param {Object} fileData  object containing file information
   * @param {String} userId    credential of User
   * @param {Function} callbackParent
   */
  async function uploadFileToS3WithThumbnail(fileData) {
    // Verify File Data
    const fileName = {
      original: null,
      thumbnail: null,
    };
    let originalPath = null;
    let thumbnailPath = null;
    const dataToUpload = [];
    try {
      if (!fileData || !fileData.filename) {
        throw Boom.badData();
      }
      fileName.original = configs.S3BucketConfig.get('/picPrefix/original') + utilityFunctions.universalFunction.urlGenerator(fileData);
      fileName.thumbnail = configs.S3BucketConfig.get('/picPrefix/thumbnail') + utilityFunctions.universalFunction.urlGenerator(fileData);
      originalPath = `${Path.resolve('.')}/uploads/${fileName.original}`;
      thumbnailPath = `${Path.resolve('.')}/uploads/${fileName.thumbnail}`;

      await saveFile(fileData.path, originalPath);

      await createThumbnailImage(originalPath, thumbnailPath);

      originalPath = await fs.readFileAsync(originalPath);
      thumbnailPath = await fs.readFileAsync(thumbnailPath);
      const original = {
        originalPath,
        nameToSave: fileName.original,
        contentType: fileData.headers['content-type'],
      };
      const thumbnail = {
        originalPath: thumbnailPath,
        nameToSave: fileName.thumbnail,
        contentType: fileData.headers['content-type'],
      };
      dataToUpload.push(original, thumbnail);
      const uploadToS3 = await parallelUploadTOS3(dataToUpload);
      const images = {
        original: uploadToS3[0],
        thumbnail: uploadToS3[1],
      };
      return images;
    } catch (error) {
      winstonLogger.error(error);
      throw Boom.wrap(error);
    }
  }


  /**
   * @function <b>uploadFile</b><br> Method to upload file to S3 Bucket
   * @param {Object} fileData object containing file information
   * @param {String} userId   credential of User
   * @param {String} type     Type Of User ["ROLE"]
   * @param {Number} signedURL time in minutes to expire the s3 bucket request url
   * @param {Function} callbackParent
   */
  async function uploadFile(fileData) {
    const fileName = {
      original: null,
    };
    let originalPath = null;
    const dataToUpload = [];

    try {
      if (!fileData || !fileData.filename) {
        throw Boom.badData();
      }
      fileName.original = configs.S3BucketConfig.get('/picPrefix/original') + utilityFunctions.universalFunction.urlGenerator(fileData);
      const path = `${Path.resolve('.')}/uploads/${fileName.original}`;

      await saveFile(fileData.path, path);

      originalPath = `${Path.resolve('.')}/uploads/${fileName.original}`;
      dataToUpload.push({
        originalPath,
        nameToSave: fileName.original,
      });
      const uploadToS3 = await parallelUploadTOS3(dataToUpload);
      return uploadToS3;
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }

  return {
    serviceName: 'S3Bucket',
    uploadFile,
    uploadFileToS3WithThumbnail,
  };
};
