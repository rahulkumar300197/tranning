const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const notificationSchema = new mongoose.Schema({
    notificationUserID: { type: mongoose.Schema.ObjectId, ref: 'User', index: true, sparse: true },
    isAdminNotification: { type: Boolean, default: false, index: true, sparse: true },
    eventID: { type: String },
    eventType: { type: String },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('Notification', notificationSchema);
};
