
const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const configs = server.plugins['core-config'];

  const sessionSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    remoteIP: { type: String },
    deviceType: {
      type: String,
      enum: [
        configs.UserConfiguration.get('/deviceTypes', { type: 'ios' }),
        configs.UserConfiguration.get('/deviceTypes', { type: 'android' }),
        configs.UserConfiguration.get('/deviceTypes', { type: 'web' }),
      ],
    },
    deviceToken: {
      type: String,
    },
  }, { timestamps: true });

  return mongoose.model('Session', sessionSchema);
};
