

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const appVersionSchema = new mongoose.Schema({
    latestIOSVersion: { type: Number },
    latestAndroidVersion: { type: Number },
    criticalAndroidVersion: { type: Number },
    criticalIOSVersion: { type: Number },
    latestWebID: { type: Number },
    criticalWebID: { type: Number },
    timeStamp: { type: Date, default: Date.now },
    updateMessageAtPopup: { type: String, required: true },
    updateTitleAtPopup: { type: String, required: true },
  });

  return mongoose.model('AppVersion', appVersionSchema);
};
