const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const configs = server.plugins['core-config'];

  const userRejectionSchema = new mongoose.Schema({
    round: { type: Number, required: true, default: 0 },
    radius: { type: Number, required: true },
    bookingID: { type: mongoose.Schema.ObjectId, ref: 'Booking', required: true },
    forWhom: {
      type: String,
      enum: [
        configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
        configs.AppConfiguration.get('/roles', { role: 'driver' }),
      ],
      required: true,
      index: true,
    },
    users: [{
      // userID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      // }
    },
    ],
  }, { timestamps: true });
  return mongoose.model('roundCompletedUser', userRejectionSchema);
};
