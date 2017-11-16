const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const referralBenifits = {
    _id: false,
    cashback: { type: Number },
    percentage: { type: Number },
    minimumBookingPrice: { type: Number },
    operatableBooking: { type: Number },
    waitBookingNumber: { type: Number },
    isAppliedAfterBooking: { // if set to false, cash or percentage acts as discount, else act as cashback
      type: Boolean,
    },
    referredTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    isReferralCredited: { type: Boolean, default: false },
  };
  const walletSchema = new mongoose.Schema({
    // TODO wallet model to be added in user folder
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    cash: { type: Number, default: 0, required: true },
    referralBenifits: [referralBenifits],
  }, { timestamps: true });

  return mongoose.model('UserWallet', walletSchema);
};
