exports.register = function (server, options, next) {
  server.auth.strategy('preVerificationAuth', 'bearer-access-token',
    {
      allowQueryToken: false,
      allowMultipleHeaders: true,
      accessTokenName: 'accessToken',
      validateFunc(token, callback) {
        const services = server.plugins['core-services'];
        services.UserService.decodeSessionToken(token)
          .then(response => callback(null, true, { scope: response.role, tokenData: response }))
          .catch((error) => {
            winstonLogger.error(error);
            callback(error, false, null);
          });
      },
    });

  server.auth.strategy('JwtAuth', 'bearer-access-token',
    {
      allowQueryToken: false,
      allowMultipleHeaders: true,
      accessTokenName: 'accessToken',
      validateFunc(token, callback) {
        const services = server.plugins['core-services'];
        services.UserService.verifySession(token)
          .then(response => callback(null, true, { scope: response.role, UserSession: response }))
          .catch((error) => {
            winstonLogger.error(error);
            callback(error, false, null);
          });
      },
    });

  next();
};


exports.register.attributes = {
  name: 'auth',
};
