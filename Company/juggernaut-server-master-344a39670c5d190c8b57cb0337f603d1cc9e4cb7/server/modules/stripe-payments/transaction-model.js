

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const transactionSchema = new mongoose.Schema({
    customerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'StripeCustomer',
    },
    trxId: { type: String, unique: true, required: true },
    type: { type: String },
    amount: { type: String },
  }, { timestamps: true });

  return mongoose.model('Transaction', transactionSchema);
};
