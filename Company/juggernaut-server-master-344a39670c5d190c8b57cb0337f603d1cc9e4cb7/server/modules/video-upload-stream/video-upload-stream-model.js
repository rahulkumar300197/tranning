const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const videoUploadSchema = new mongoose.Schema({
    videoName: { type: String, required: true },
    videoS3BucketURL: { type: String, required: true },
    videoCloudFrontURL: { type: String, required: true },
  }, { timestamps: true });

  return mongoose.model('videoUploadToS3', videoUploadSchema);
};
