
const internals = {};

exports.load = internals.Model = function (server) {
  const mongoose = server.plugins.bootstrap.mongoose;
  const configs = server.plugins['core-config'];
  const userSchema = new mongoose.Schema({
    contacts: [{
      mobile: { type: String },
      isVerified: { type: Boolean, default: false },
      isPrimary: { type: Boolean, default: false },
      mobileOTP: { type: Number },
      countryCode: { type: String },
      otpUpdatedAt: { type: Date },
    }],
    userName: { type: String, index: true, trim: true },
    name: { type: String, trim: true, index: true, default: null, sparse: true },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, index: true, sparse: true },
    countryCode: { type: String },
    mobile: { type: String, index: true, trim: true, sparse: true },
    forgotPasswordMobileOTP: { type: Number, index: true, time: true, sparse: true },
    rememberMe: { type: Boolean, default: false },
    password: { type: String, required: false },

    emailVerificationToken: { type: String, required: false },
    emailVerificationTokenUpdatedAt: { type: Date },
    utcoffset: { type: Number },
    cronHardDeleteCount: { type: Number, default: 0, required: true },
    passwordResetToken: { type: String, default: null },
    totalRatingPoints: { type: Number, default: 0 },
    ratedByUserCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
    totalCreatedUsers: {
      type: Number,
      default: 0,
    },
    role: [{
      type: String,
      // ref: 'role',
      // required: true,
    }],
    customerID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
      default: null,
    },
    serviceProviderID: {
      type: mongoose.Schema.ObjectId,
      ref: 'ServiceProvider',
      default: null,
    },
    driverID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Driver',
      default: null,
    },
    customerAddressID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Address',
      default: null,
    },
    serviceProviderAddressID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Address',
      default: null,
    },
    driverAddressID: {
      type: mongoose.Schema.ObjectId,
      ref: 'Address',
      default: null,
    },
    socialAccounts: [{
      type: {
        type: String,
        enum: [
          configs.UserConfiguration.get('/social', { type: 'facebook' }),
          configs.UserConfiguration.get('/social', { type: 'google' }),
          // configs.UserConfiguration.get('/social', { type: 'linkedIn' }),
        ],
      },
      socialID: { type: String },
      _id: false,
    }],

    isBlocked: { type: Boolean, default: false, required: true },
    isDeleted: { type: Boolean, default: false, required: true },
    isAdminVerified: { type: Boolean, default: false, required: true },
    isEmailVerified: { type: Boolean, default: false, required: true },
    isPhoneVerified: { type: Boolean, default: false, required: true },
  }, { timestamps: true });

  return mongoose.model('User', userSchema);
};
