

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const trackingSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    currentLocation: [{
      _id: false,
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    }],
  }, { timestamps: true });

  return mongoose.model('Tracking', trackingSchema);
};
