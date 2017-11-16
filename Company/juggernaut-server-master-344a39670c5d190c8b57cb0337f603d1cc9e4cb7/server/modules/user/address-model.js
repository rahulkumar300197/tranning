

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const configs = server.plugins['core-config'];

  const addressSchema = new mongoose.Schema({
    companyName: { type: String },
    companyAddress: { type: String },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    zipCode: { type: String, default: null },
    addressType: { type: String,
      enum: [
        configs.AppConfiguration.get('/address', { type: 'SELF' }),
        configs.AppConfiguration.get('/address', { type: 'DELIVERY' }),
        configs.AppConfiguration.get('/address', { type: 'PICKUP' }),
      ],
    },
    // for booking pick and delivery addresses only
    customerID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
      default: null,
    },
  }, { timestamps: true });

  return mongoose.model('Address', addressSchema);
};
