const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const reviewSchema = new mongoose.Schema({
    reviewBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    reviewed: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    bookingID: { type: mongoose.Schema.ObjectId, ref: 'Booking', required: true },
    review: { type: String },
    rating: { type: Number },
  }, { timestamps: true });

  return mongoose.model('Review', reviewSchema);
};
