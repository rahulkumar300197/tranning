

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const Schema = mongoose.Schema;

  const messageSchema = new Schema({
    isResourceBundleURI: { type: Boolean, default: false },
    messageKey: { type: String, unique: true },
    customMessage: { type: String },
  }, { _id: false });

  const multilingualSchema = new Schema({
    locale: { type: String, default: 'en', index: true, unique: true },
    localeName: { type: String },
    messages: [messageSchema],
    isActive: { type: Boolean, default: true },
  }, { timestamps: true });

  return mongoose.model('multilingual', multilingualSchema);
};
