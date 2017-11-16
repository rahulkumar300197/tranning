

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const Schema = mongoose.Schema;

  const attributesAllowed = new Schema({
    role: {
      type: String,
      // ref: 'role',
    },
    completeAccess: { type: Boolean },
    objectRights: [{ type: String, default: 'all' }],
  });
  // subschema for likes by users on particular comment
  const authorizationSchema = new Schema({
    uniqueApiPath: { type: String, unique: true, index: true },
    alias: { type: String, unique: true, index: true },
    permissionName: { type: String },
    roleAccess: [attributesAllowed],
    allowedToUpdate: [{
      type: String,
      // ref: 'User',
    }],
  }, { timestamps: true });

  return mongoose.model('Authorization', authorizationSchema);
};
