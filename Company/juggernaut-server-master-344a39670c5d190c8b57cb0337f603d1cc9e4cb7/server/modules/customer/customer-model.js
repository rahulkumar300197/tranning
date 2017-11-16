

const internals = {};

exports.load = internals.Model = function (server) {
  const configs = server.plugins['core-config'];
  const mongoose = server.plugins.bootstrap.mongoose;

  const customerSchema = new mongoose.Schema({
    image: { type: String, default: null },
    deviceType: {
      type: String,
      enum: [
        configs.UserConfiguration.get('/deviceTypes', { type: 'ios' }),
        configs.UserConfiguration.get('/deviceTypes', { type: 'android' }),
        configs.UserConfiguration.get('/deviceTypes', { type: 'web' }),
      ],
    },
    appVersion: { type: String },
    deviceToken: { type: String, trim: true, index: true, sparse: true },
  }, { timestamps: true });

  return mongoose.model('Customer', customerSchema);
};
