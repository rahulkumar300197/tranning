

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const bidSchema = new mongoose.Schema({
    driverID: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    serviceProviderID: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    customerID: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    bookingID: { type: mongoose.Schema.ObjectId, ref: 'Booking', required: true },
    biddingAmount: { type: String, required: true },
    biddingStatus: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('Bid', bidSchema);
};
