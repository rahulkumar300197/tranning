

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const customerSupportSchema = new mongoose.Schema({
    countryCode: { type: String, required: true, index: true },
    mobile: { type: String, required: true, trim: true, index: true, min: 5, max: 15 },
  }, { timestamps: true });

  return mongoose.model('CustomerSupport', customerSupportSchema);
};
