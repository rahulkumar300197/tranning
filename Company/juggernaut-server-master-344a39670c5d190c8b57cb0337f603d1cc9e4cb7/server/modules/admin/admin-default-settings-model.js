const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const adminSettingsSchema = new mongoose.Schema({
    // in seconds
    otpExpiresIn: { type: Number, default: 300 },
    linkExpiresIn: { type: Number, default: 300 },
    deleteTrackingData: { type: Number, default: 1 },
    webMultiSession: { type: Boolean, default: true },
    deviceMultiSession: { type: Boolean, default: true },
    adminTokenExpireTime: { type: Number, default: 30 }, // minutes
    userTokenExpireTime: { type: Number, default: 43200 }, // 30 days
    referralSchemeType: { type: String },
  }, { timestamps: true });

  return mongoose.model('AdminSetting', adminSettingsSchema);
};
