const Confidence = require('confidence');


const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  const criteria = {
    lang: 'eng',
  };

  const config = {

    picPrefix: {
      original: 'original_',
      thumbnail: 'thumbnail_',
    },

    thumbnailSize: {
      length: 200,
      width: 200,
    },

    LOGO_PREFIX: {
      ORIGINAL: 'logo_',
      THUMB: 'logoThumb_',
    },

    s3BucketCredentials: {
      bucket: 'truckerapi',
      accessKeyId: 'AKIAJQINXM2EURIM2PBA',
      secretAccessKey: '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',
      region: 'us-west-2',
      s3URL: 'https:PROFILE_PIC_PREFIX//s3.amazonaws.com/baseProject/',
      s3URL2: 'https://s3-us-west-2.amazonaws.com/baseProject/',
      s3URLSIte: 'https://s3-us-west-2.amazonaws.com/truckerapi/site/',
      folder: {
        profilePicture: 'profilePicture',
        thumb: 'thumb',
        site: 'site',
        user: 'user',
        tempFolder: 'tempFolder',
      },
    },
  };

  const store = new Confidence.Store(config);

  const get = function (key) {
    return store.get(key, criteria);
  };


  const meta = function (key) {
    return store.meta(key, criteria);
  };

  return {
    configurationName: 'S3BucketConfig',
    config,
    get,
    meta,
  };
};
