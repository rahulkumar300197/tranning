

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;

  const Schema = mongoose.Schema;

  const addLocation = new Schema({
    categoryID: {
      type: Schema.ObjectId,
      ref: 'Category',
    },
    serviceID: {
      type: Schema.ObjectId,
      ref: 'Service',
    },
    // city: { type: String },
    parentID: {
      type: Schema.ObjectId,
      ref: 'Category',
    },
    geoLocation: {
      type: { type: String, enum: 'Polygon', default: 'Polygon' },
      coordinates: { type: Array },
    },
    geoLocationRegionName: { type: String },
    // searchCityFirst: { type: Boolean },
  });

  addLocation.index({ geoLocation: '2dsphere' });
  addLocation.index({ categoryID: 1, geoLocation: 1 }, { unique: true });
  addLocation.index({ serviceID: 1, geoLocation: 1 }, { unique: true });
  return mongoose.model('CategoryLocation', addLocation);
};
