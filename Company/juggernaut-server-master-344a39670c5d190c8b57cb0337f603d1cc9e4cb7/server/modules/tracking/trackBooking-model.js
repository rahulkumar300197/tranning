const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const routingInfo = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: { type: Date, default: Date.now },
  });


  const trackBookingSchema = new mongoose.Schema({
    bookingID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Booking',
    },
    driverID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    customerID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    driverName: {
      type: String,
    },
    trackingFinished: { type: Boolean, default: false },
    s3URL: { type: String },
    route: [routingInfo],
  }, { timestamps: true });


  return mongoose.model('trackBooking', trackBookingSchema);
};
