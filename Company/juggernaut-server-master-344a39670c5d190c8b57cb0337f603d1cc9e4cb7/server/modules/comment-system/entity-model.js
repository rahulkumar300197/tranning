

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const Schema = mongoose.Schema;

  // subschema for likes by users on particular comment
  const entitySchema = new Schema({
    entityText: { type: String },
  }, { timestamps: true });
  return mongoose.model('Entity', entitySchema);
};
