const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const referralAvailableSchema = new mongoose.Schema({

    waitBookingNumber: { // number of bookings user have to wait to get referral benefits
      type: Number,
      default: 0,
    },

    minimumBookingPrice: {
      type: Number,
      default: 0,
    },

    isAppliedAfterBooking: { // if set to false, cash or percentage acts as discount, else act as cashback
      type: Boolean,
      default: false,
    },

    cashback: {
      toOwner: { type: Number },
      toUser: { type: Number },
    },
    percentage: {
      toOwner: { type: Number },
      toUser: { type: Number },
    },
    operatableBooking: {
      toOwner: { type: Number },
      toUser: { type: Number },
    },
    referralPattern: {
      type: String,
      index: true,
    },

    noOfReferrals: {
      type: Number,
      required: true,
    },

    createdByUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
    },
    referralApplicableLocation: {
      type: { type: String, enum: 'Polygon', default: 'Polygon' },
      coordinates: { type: Array },
    },
    regionName: { type: String },

  }, { timestamps: true });

  return mongoose.model('ReferralAvailable', referralAvailableSchema);
};
