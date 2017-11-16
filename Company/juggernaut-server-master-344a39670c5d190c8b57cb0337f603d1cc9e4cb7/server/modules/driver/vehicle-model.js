

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const vehicleSchema = new mongoose.Schema({
    driver: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    vehicleImages: [{
      original: { type: String, default: null },
      thumbnail: { type: String, default: null },
      _id: false,
    }],
    vehicleType: { type: String, default: null },
    vehicleCompany: { type: String, default: null },
    vehicleYear: { type: Number },
    licenceNumber: { type: String },
    vehicleNumber: { type: String, unique: true },
    isDeleted: { type: Boolean, default: false },
    isPrimary: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('Vehicle', vehicleSchema);
};
