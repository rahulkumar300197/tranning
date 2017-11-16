const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const Schema = mongoose.Schema;

  // subschema for likes by users on particular comment
  const rolesSchema = new Schema({
    role: { type: String, unique: true },
    // parent: {
    //   type: Schema.ObjectId,
    //   ref: 'User',
    // },
    createdBy: {
      type: Schema.ObjectId,
      ref: 'User',
    },
  }, { timestamps: true });
  return mongoose.model('Role', rolesSchema);
};
