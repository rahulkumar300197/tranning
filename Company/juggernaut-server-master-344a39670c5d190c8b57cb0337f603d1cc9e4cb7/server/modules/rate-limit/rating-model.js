const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const rateLimitSchema = new mongoose.Schema({
    isEnabled: { type: Boolean, default: false },
    userLimit: { type: Number },
    userLimitExpiresIn: { type: Number },
    pathLimit: { type: Number },
    pathLimitExpiresIn: { type: Number },
  }, { timestamps: true });

  return mongoose.model('RequestRateLimit', rateLimitSchema);
};
