/*
Created by Isha Dogra on 24-05-2017
*/


const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const serviceProviders = new mongoose.Schema({
    serviceProviderID:
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    isApproved: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false },
  });

  const serviceSchema = new mongoose.Schema({
    parentCategory: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
    },
    serviceName: { type: String, trim: true, required: true },
    description: { type: String, trim: true, required: true },
    serviceProviders: [serviceProviders],
    baseCost: { type: Number, default: 0 }, // estimated cost for service
    durationInMinutes: { type: Number, default: 0 }, // estimated time for service
    tags: { type: [String] },
    /* TODO - active regions where service is available
    regions:{ //create regions table - add reference here}, */
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('Service', serviceSchema);
};
