

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const Schema = mongoose.Schema;

  // subschema for likes by users on particular comment
  const likesSchema = new Schema({
    user: {
      type: Schema.ObjectId,
      ref: 'User',
    },
    likeLevel: { type: Number, default: 0 },
    likedOnEntity: {
      type: Schema.ObjectId,
      ref: 'Entity',
    },
    likedOnComment: {
      type: Schema.ObjectId,
      ref: 'Comment',
    },
    // likeLevel: { type:Number, default:0},
    timestamp: { type: Date, default: Date.now },
  }, { timestamps: true });

  return mongoose.model('Like', likesSchema);
};
