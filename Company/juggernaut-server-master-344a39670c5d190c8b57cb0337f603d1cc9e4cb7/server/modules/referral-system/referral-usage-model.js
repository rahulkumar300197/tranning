const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const referralUsageSchema = new mongoose.Schema({
    referralPattern: { type: String, requied: true },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    referralCode: { type: String, required: true, index: true },
    referralCodeUsed: { type: String },
    noOfReferralsUsed: { type: Number, default: 0 },
    noOfReferrals: { type: Number, default: 50 },
  }, { timestamps: true });

  return mongoose.model('ReferralUsage', referralUsageSchema);
};
