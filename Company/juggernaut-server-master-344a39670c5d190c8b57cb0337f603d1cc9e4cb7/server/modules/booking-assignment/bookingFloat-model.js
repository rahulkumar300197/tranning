const internals = {};

exports.load = internals.Model = function (server) {
  const configs = server.plugins['core-config'];
  const mongoose = server.plugins.bootstrap.mongoose;
  const bookingFloatSettingSchema = new mongoose.Schema({
    typeOfAlgo: {
      type: String,
      enum: [
        configs.BookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'MANUAL' }),
        configs.BookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'BROADCAST' }),
        configs.BookingConfiguration.get('/ASSIGNMENT_ALGO', { type: 'ROUND_ROBIN' }),
      ],
      required: true,
    },
    distanceRange: { type: Number, required: true },
    requestExpiresIn: { type: Number, required: true }, // in seconds
    reAttempt: { type: Number, required: 0, default: 0 }, // in seconds 
    increaseDistanceBy: { type: Number },
    percentageHikeInBookingPrice: { type: Number }, // percentage
    adminCutFromBooking: { type: Number }, // amount of admin commission
    forWhom: {
      type: String,
      enum: [
        configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
        configs.AppConfiguration.get('/roles', { role: 'driver' }),
      ],
      required: true,
      index: true,
    },
    serviceProviderID: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    // isActive: { type: Boolean, default: true }
  }, { timestamps: true });

  return mongoose.model('bookingFloatSetting', bookingFloatSettingSchema);
};
