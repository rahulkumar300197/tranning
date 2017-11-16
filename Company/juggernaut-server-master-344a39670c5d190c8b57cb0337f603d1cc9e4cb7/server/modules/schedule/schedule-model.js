/*
Created by Isha Dogra on 31-05-2017
*/


const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const scheduleSchema = new mongoose.Schema({
    serviceID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Service',
    },
    serviceProviderID: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    startTime: { type: Number, trim: true, required: true },
    endTime: { type: Number, trim: true, required: true },
    dayOfWeek: { type: String, trim: true },
    isDeleted: { type: Boolean, required: true, default: false },
    isNotified: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('Schedule', scheduleSchema);
};
