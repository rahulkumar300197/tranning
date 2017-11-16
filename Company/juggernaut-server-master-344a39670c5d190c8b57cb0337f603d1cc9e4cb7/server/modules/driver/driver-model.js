

const internals = {};

exports.load = internals.Model = function (server) {
  const configs = server.plugins['core-config'];
  const mongoose = server.plugins.bootstrap.mongoose;

  const driverSchema = new mongoose.Schema({
    serviceProvider: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    currentDriverLocation: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
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
    image: { type: String, default: null },
    isActive: { type: Boolean, default: false, required: true },
  }, { timestamps: true });

  driverSchema.index({ currentDriverLocation: '2dsphere' });

  return mongoose.model('Driver', driverSchema);
};
