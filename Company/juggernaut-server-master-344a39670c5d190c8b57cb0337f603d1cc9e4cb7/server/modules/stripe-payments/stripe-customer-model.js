

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const stripeSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    type: { type: String },
    stripeId: { type: String, unique: true, required: true },
    cardId: { type: String, unique: true, required: true },
    cardFingerPrints: { type: String },
  }, { timestamps: true });

  return mongoose.model('StripeCustomer', stripeSchema);
};
