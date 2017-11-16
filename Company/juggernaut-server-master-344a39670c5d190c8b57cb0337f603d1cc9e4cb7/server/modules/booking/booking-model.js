

const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const configs = server.plugins['core-config'];
  const bookingConfiguration = configs.BookingConfiguration;


  const bookingSchema = new mongoose.Schema({
    // custom ID of booking for reference
    customID: { type: String, required: true },

    // service id to which booking belongs
    serviceID: { type: mongoose.Schema.ObjectId, ref: 'Service', required: true },

    // users related to booking
    customer: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },

    driver: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    driverName: { type: String, required: true, default: null },

    serviceProvider: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    serviceProviderName: { type: String, required: true, default: null },

    // delivery location details
    deliveryName: { type: String, trim: true, index: true, default: null, sparse: true },
    deliveryEmail: { type: String, trim: true, index: true, required: true },
    deliveryMobile: { type: String, required: true, trim: true, index: true, min: 5, max: 15 },
    deliveryCompanyName: { type: String, trim: true, index: true, default: null, sparse: true },
    deliveryCity: { type: String, default: null },
    deliveryState: { type: String, default: null },
    deliveryZipcode: { type: String, default: null },
    deliveryCompanyAddress: { type: String, default: null },
    deliveryCoordinates: { type: { type: String, default: 'Point' }, coordinates: [Number] },

    // delivery time buffer
    deliveryDateTimeFrom: { type: Date },
    deliveryDateTimeTo: { type: Date },

    // pickup location details
    pickupName: { type: String, trim: true, index: true, default: null, sparse: true },
    pickupEmail: { type: String, trim: true, index: true, required: true },
    pickupMobile: { type: String, required: true, trim: true, index: true, min: 5, max: 15 },
    pickupCompanyName: { type: String, trim: true, index: true, default: null, sparse: true },
    pickupCity: { type: String, default: null },
    pickupState: { type: String, default: null },
    pickupZipcode: { type: String, default: null },
    pickupCompanyAddress: { type: String, default: '' },
    pickupCoordinates: { type: { type: String, default: 'Point' }, coordinates: [Number] },

    // pickup time estimate
    pickupDateTimeFrom: { type: Date },
    pickupDateTimeTo: { type: Date },

    // proof of successfull delivery image url
    proofOfDelivery: { type: String, default: null },

    price: { type: Number, default: 0 },
    currentStatus: { type: String, default: bookingConfiguration.get('/BOOKING_STATUS', { STATUS: 'PENDING' }) },

    // cancel booking reasons
    cancelReasonByDriver: { type: String, default: null },
    cancelReasonByCustomer: { type: String, default: null },
    cancelReasonByServiceProvider: { type: String, default: null },

    // booking finish time
    bookingCompletionDateTime: { type: Date },
  }, { timestamps: true });

  return mongoose.model('Booking', bookingSchema);
};
