const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const referralAvailableSchema = new mongoose.Schema({
    promoSchemeType: {
      type: String,
    },

    minimumBookingPrice: {
      type: Number,
      default: 0,
    },

    cashback: {
      type: Number,
    },

    percentage: {
      type: Number,
    },

    maxCashback: {
      type: Number,
    },

    individualUserPromoAttempt: {
      type: Number,
      default: 1,
    },

    promoPattern: {
      type: String,
      index: true,
    },

    alias: {
      type: String,
      index: true,
    },

    noOfPromoUsers: {
      type: Number,
      required: true,
      default: 0,
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

    promoApplicableLocation: {
      type: { type: String, enum: 'Polygon', default: 'Polygon' },
      coordinates: { type: Array },
    },
    regionName: { type: String },

  }, { timestamps: true });

  return mongoose.model('Promo', referralAvailableSchema);
};
