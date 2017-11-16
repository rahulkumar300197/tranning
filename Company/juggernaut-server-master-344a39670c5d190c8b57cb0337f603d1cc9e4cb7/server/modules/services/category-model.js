

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const Schema = mongoose.Schema;
  const categorySchema = new mongoose.Schema({
    categoryName: { type: String, index: true, required: true },
    icon: { type: String },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
    parentID: {
      type: Schema.ObjectId,
      ref: 'Category',
      default: null,
    },
    hasChild: { type: Boolean, default: false },
  }, { timestamps: true });

  return mongoose.model('Category', categorySchema);
};
