

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const twilioCallRequestSchema = new mongoose.Schema({
    callerRole: { type: String, required: true },
    caller: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    fromPhoneNumber: { type: String },
    recieverRole: { type: String, required: true },
    reciever: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    toPhoneNumber: { type: String, default: null },
  }, { timestamps: true });

  return mongoose.model('twilioCallRequest', twilioCallRequestSchema);
};
