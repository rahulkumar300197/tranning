const bcrypt = P.promisifyAll(require('bcrypt'));
const Joi = require('joi');
const randomstring = require('randomstring');
const GeoPoint = require('geopoint');
const shortid = require('shortid');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];

  /**
     * @function <b> hashPasswordUsingBcrypt </b> <br>
     * Hash Password
     * @param {String} plainTextPassword Unsecured Password
     * @return {String} Secured Password
     */
  const hashPasswordUsingBcrypt = function (plainTextPassword) {
    const saltRounds = 10;
    return bcrypt.hashSync(plainTextPassword, saltRounds);
  };

  function urlGenerator(fileData) {
    const ext = fileData.filename.substr(fileData.filename.lastIndexOf('.') || 0, fileData.filename.length);
    const date = new Date();
    const uniqueURL = shortid.generate() + date.getTime() + ext;
    return uniqueURL;
  }
  /**
   * @function <b>comparePasswordUsingBcrypt</b><br>Verify Password
   * @param {String} plainTextPassword Password to be checked
   * @param {String} passwordhash Hashed Password
   */
  const comparePasswordUsingBcrypt = function (plainTextPassword, passwordhash) {
    return bcrypt.compareSync(plainTextPassword, passwordhash);
  };

  /**
   * @function <b>sendSuccess</b><br>Method to return response in a defined format
   * @param {*} response
   * @param {*} lang
   */

  const sendSuccess = async function (headers, response) {
    const statusCode = (response && response.statusCode) || 200;
    // eslint-disable-next-line max-len
    const message = (response && response.message) || configs.MessageConfiguration.get('/lang', { locale: headers['content-language'], message: 'SUCCESS' });
    const data = response || null;
    return { statusCode, message, data };
  };
  // eslint-disable-next-line
  const paymentFailure = async function (headers, error) {
    const statusCode = 400;
    const message = configs.MessageConfiguration.get('/lang', { locale: headers['content-language'], message: 'SOMETHING_WRONG' });
    const data = null;
    return { statusCode, message, data };
  };

  /**
   * @function <b>failActionFunction</b><br> Used to handle bad payload fields
   * @param {Object} request
   * @param {Object} reply
   * @param {Object} source
   * @param {Object} error
   */

  const failActionFunction = function (request, reply, source, error) {
    let customErrorMessage = '';
    if (error.output.payload.message.indexOf('[') > -1) {
      customErrorMessage = error.output.payload.message.substr(error.output.payload.message.indexOf('['));
    } else {
      customErrorMessage = error.output.payload.message;
    }
    customErrorMessage = customErrorMessage.replace(/"/g, '');
    customErrorMessage = customErrorMessage.replace('[', '');
    customErrorMessage = customErrorMessage.replace(']', '');
    error.output.payload.message = customErrorMessage;
    delete error.output.payload.validation;
    return reply(error);
  };

  const authorizationHeaderObj = Joi.object({
    authorization: Joi.string().required().description('Bearer Token'),
    'content-language': Joi.string().required().description('en/ar'),
  }).unknown();


  /**
   * @function <b>getDistanceBetweenPoints</b><br> CalculateDistance between given points
   * @param {Object} origin source lat long
   * @param {Object} destination destination lat long
   */
  const getDistanceBetweenPoints = (origin, destination) => {
    const start = new GeoPoint(origin.latitude, origin.longitude);
    const end = new GeoPoint(destination.latitude, destination.longitude);
    return start.distanceTo(end, true);
  };

  const generateRandomString = function (noOfChars) {
    return randomstring.generate(noOfChars);
  };

  const radians = function (deg) {
    return deg * (Math.PI / 180);
  };

  const degrees = function (rad) {
    return rad * (180 / Math.PI);
  };

  const getBearing = (startLat, startLong, endLat, endLong) => {
    startLat = radians(startLat);
    startLong = radians(startLong);
    endLat = radians(endLat);
    endLong = radians(endLong);

    let dLong = endLong - startLong;
    const dPhi = Math.log(Math.tan((endLat / 2.0) + (Math.PI / 4.0)) / Math.tan((startLat / 2.0) + (Math.PI / 4.0)));
    if (Math.abs(dLong) > Math.PI) {
      if (dLong > 0.0) {
        dLong = -((2.0 * Math.PI) - dLong);
      } else {
        dLong = ((2.0 * Math.PI) + dLong);
      }
    }
    return (degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
  };

  return {
    utilityName: 'universalFunction',
    hashPasswordUsingBcrypt,
    comparePasswordUsingBcrypt,
    sendSuccess,
    failActionFunction,
    authorizationHeaderObj,
    getDistanceBetweenPoints,
    generateRandomString,
    urlGenerator,
    getBearing,
    paymentFailure,
  };
};
