

const internals = {};

exports.load = internals.Model = function (server) {
  const configs = server.plugins['core-config'];
  const mongoose = server.plugins.bootstrap.mongoose;

  const serviceProviderSchema = new mongoose.Schema({
    vehicleNumber: { type: String },
    timezone: { type: String },
    image: { type: String, default: null },
    referalCode: { type: String },
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
    registrationType: { type: String, required: true },
    layoutType: { type: Number, default: 1 },
    step: { type: Number, default: 1 },
    currentSPLocation: {
      type:
      {
        type: String,
        default: 'Point',
      },
      coordinates: [Number],
    },
  }, { timestamps: true });

  serviceProviderSchema.index({ currentSPLocation: '2dsphere' });
  return mongoose.model('ServiceProvider', serviceProviderSchema);
};
