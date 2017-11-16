

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const Schema = mongoose.Schema;

  const commentSchema = new Schema({
    commentText: { type: String },
    commentLevel: { type: Number, default: 0 },
    // comment by user
    user: {
      type: Schema.ObjectId,
      ref: 'User',
    },
    upperCommentID: {
      type: Schema.ObjectId,
      ref: 'Comment',
    },
    // comment on entity by user e.g. video/photo
    entityID: {
      type: Schema.ObjectId,
      ref: 'Entity',
    },
  }, { timestamps: true });

  return mongoose.model('Comment', commentSchema);
};
