

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const vehicleSchema = new mongoose.Schema({
    vehicleType: { type: String, default: null },
    vehicleCompany: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('VehicleDetail', vehicleSchema);
};
