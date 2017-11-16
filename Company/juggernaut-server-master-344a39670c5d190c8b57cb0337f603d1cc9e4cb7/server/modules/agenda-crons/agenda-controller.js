const Agenda = require('agenda');
const Config = require('../../config');

const internals = {};

exports.load = internals.controller = (server) => {
  const services = server.plugins['core-services'];
  const configs = server.plugins['core-config'];


  /** *****************************************************************************************
   *                                                                                         *
   *                                                                                         *
   *                   Booking Float Cron for Driver --- START                               *
   *                                                                                         *
   *                                                                                         *
   ****************************************************************************************** */


  /**
   * broadcastReAttemptForSP broadcast booking notification for serviceProvider for 
   * reAttempts if not accepted within expired time
   * @param {JSON} headers content-language and authorization headers
   * @param {JSON} bookingData 
   * @param {JSON} bookingFloatSetting booking notification algo data
   * @param {String} bookingType type of booking notification
   */
  async function broadcastReAttemptForDriver(headers, bookingData, bookingFloatSetting, bookingType, userData) {
    const controllers = server.plugins['core-controller'];
    const reAttempt = bookingFloatSetting.reAttempt;
    const agenda = new Agenda({ db: { address: Config.get('/hapiMongoModels/mongodb/uri', { env: process.env.NODE_ENV }), collection: 'cronJobs' } });
    try {
      agenda.define(`notifyDriver for bookingID ${bookingData._id}`, async (job, done) => {
        const pendingBooking = await controllers.BookingAssignmentController.pendingBookingForDriver(bookingData);
        const criteria = {
          bookingID: bookingData._id,
          forWhom: configs.AppConfiguration.get('/roles', { role: 'driver' }),
        };
        if (pendingBooking) {
          const option = {
            lean: true,
            sort: {
              _id: 1,
            },
          };
          projection = {
            users: 1,
            round: 1,
            radius: 1,
          };
          const currentRound = await services.MongoService.getFirstMatch('roundCompletedUser', criteria, projection, option);
          let radius;
          if (!currentRound) {
            radius = bookingFloatSetting.distanceRange;
          } else {
            radius = currentRound.radius;
          }

          const allAvailableUsers = await controllers.BookingAssignmentController.availableDriver(headers, bookingData, radius, userData);
          const currentUser = [];

          for (let index = 0; index < allAvailableUsers.length; index += 1) {
            const notifiedUser = JSON.stringify((currentRound && currentRound.users[index]) || '');
            const availableDriver = JSON.stringify(allAvailableUsers[index]);
            if (notifiedUser !== availableDriver) {
              currentUser.push(allAvailableUsers[index]);
            }
          }
          if ((currentRound && currentRound.round) === reAttempt + 1) {
            await services.MongoService.deleteData('roundCompletedUser', criteria);
            // eslint-disable-next-line no-unused-vars
            agenda.cancel({ name: `notifyDriver for bookingID ${bookingData._id}` }, (err, numRemoved) => done());
          } else if (currentUser.length > 0) {
            for (let index = 0; index < currentUser.length; index += 1) {
              controllers.BookingAssignmentController.notifyDriver(currentUser[index], bookingData._id, bookingType);
            }
            if (!currentRound) {
              const newData = {
                bookingID: bookingData._id,
                forWhom: configs.AppConfiguration.get('/roles', { role: 'driver' }),
                radius,
                round: 0,
                users: currentUser,
              };
              await services.MongoService.createData('roundCompletedUser', newData);
              return done();
            }
            const newUser = {
              $push: {
                users: { $each: currentUser },
              },
            };
            await services.MongoService.updateData('roundCompletedUser', criteria, newUser, { new: true });
            return done();
          } else {
            const newUser = {
              radius: radius + bookingFloatSetting.increaseDistanceBy,
              $inc: {
                round: 1,
              },
            };
            await services.MongoService.updateData('roundCompletedUser', criteria, newUser, { new: true });
            return done();
          }
        } else {
          await services.MongoService.deleteData('roundCompletedUser', criteria);
          // eslint-disable-next-line no-unused-vars
          agenda.cancel({ name: `notifyDriver for bookingID ${bookingData._id}` }, (err, numRemoved) => done());
        }
      });

      agenda.on('ready', () => {
        let jobTime = bookingFloatSetting.requestExpiresIn;
        jobTime += ' seconds';
        agenda.every(jobTime, `notifyDriver for bookingID ${bookingData._id}`);
        agenda.start();
      });
    } catch (error) {
      winstonLogger.error(error);
    }
  }


  /**
   * RRBookingFloatForSP float booking notification for serviceProvider in
   * round robin fashion with reAttempts if not accepted within round expired time.
   * @param {*} headers content-language and authorization headers
   * @param {*} bookingData 
   * @param {*} bookingFloatSetting booking notification algo data
   * @param {*} bookingType type of booking notification
   */
  async function RRBookingFloatForDriver(headers, bookingData, bookingFloatSetting, bookingType, userData) {
    const controllers = server.plugins['core-controller'];
    const reAttempt = bookingFloatSetting.reAttempt;
    const agenda = new Agenda({ db: { address: Config.get('/hapiMongoModels/mongodb/uri', { env: process.env.NODE_ENV }), collection: 'cronJobs' } });
    try {
      agenda.define(`notifyDriver for bookingID ${bookingData._id}`, async (job, done) => {
        const pendingBooking = await controllers.BookingAssignmentController.pendingBookingForDriver(bookingData);
        const criteria = {
          bookingID: bookingData._id,
          forWhom: configs.AppConfiguration.get('/roles', { role: 'driver' }),
        };
        if (pendingBooking) {
          const option = {
            lean: true,
            sort: {
              _id: 1,
            },
          };
          projection = {
            users: 1,
            round: 1,
            radius: 1,
          };
          const currentRound = await services.MongoService.getFirstMatch('roundCompletedUser', criteria, projection, option);
          let radius;
          if (!currentRound) {
            radius = bookingFloatSetting.distanceRange;
          } else {
            radius = currentRound.radius;
          }
          const allAvailableUsers = await controllers.BookingAssignmentController.availableDriver(headers, bookingData, radius, userData);
          let currentUser;

          for (let index = 0; index < allAvailableUsers.length; index += 1) {
            const notifiedUser = JSON.stringify((currentRound && currentRound.users[index]) || '');
            const availableDriver = JSON.stringify(allAvailableUsers[index]);
            if (notifiedUser !== availableDriver) {
              currentUser = allAvailableUsers[index];
              break;
            }
          }
          if ((currentRound && currentRound.round) === reAttempt + 1) {
            await services.MongoService.deleteData('roundCompletedUser', criteria);
            // eslint-disable-next-line no-unused-vars
            agenda.cancel({ name: `notifyDriver for bookingID ${bookingData._id}` }, (err, numRemoved) => done());
          } else if (currentUser) {
            controllers.BookingAssignmentController.notifySP(currentUser, bookingData._id, bookingType);
            if (!currentRound) {
              const newData = {
                bookingID: bookingData._id,
                forWhom: configs.AppConfiguration.get('/roles', { role: 'driver' }),
                radius,
                round: 0,
                users: [currentUser],
              };
              await services.MongoService.createData('roundCompletedUser', newData);
              return done();
            }
            const newUser = {
              $push: {
                users: currentUser,
              },
            };
            await services.MongoService.updateData('roundCompletedUser', criteria, newUser, { new: true });
            return done();
          } else {
            const newUser = {
              radius: radius + bookingFloatSetting.increaseDistanceBy,
              $inc: {
                round: 1,
              },
            };
            await services.MongoService.updateData('roundCompletedUser', criteria, newUser, { new: true });
            return done();
          }
        } else {
          await services.MongoService.deleteData('roundCompletedUser', criteria);
          // eslint-disable-next-line no-unused-vars
          agenda.cancel({ name: `notifyDriver for bookingID ${bookingData._id}` }, (err, numRemoved) => done());
        }
      });

      agenda.on('ready', () => {
        let jobTime = bookingFloatSetting.requestExpiresIn;
        jobTime += ' seconds';
        agenda.every(jobTime, `notifyDriver for bookingID ${bookingData._id}`);
        agenda.start();
      });
    } catch (error) {
      winstonLogger.error(error);
    }
  }

  /** *****************************************************************************************
   *                                                                                         *
   *                                                                                         *
   *                   Booking Float Cron for Driver --- END                                 *
   *                                                                                         *
   *                                                                                         *
   ****************************************************************************************** */


  /** *****************************************************************************************
   *                                                                                         *
   *                                                                                         *
   *                   Booking Float Cron for Service Provider --- START                     *
   *                                                                                         *
   *                                                                                         *
   ****************************************************************************************** */

  /**
   * broadcastReAttemptForSP broadcast booking notification for serviceProvider for 
   * reAttempts if not accepted within expired time
   * @param {JSON} headers content-language and authorization headers
   * @param {JSON} bookingData 
   * @param {JSON} bookingFloatSetting booking notification algo data
   * @param {String} bookingType type of booking notification
   */
  async function broadcastReAttemptForSP(headers, bookingData, bookingFloatSetting, bookingType) {
    const controllers = server.plugins['core-controller'];
    const reAttempt = bookingFloatSetting.reAttempt;
    const agenda = new Agenda({ db: { address: Config.get('/hapiMongoModels/mongodb/uri', { env: process.env.NODE_ENV }), collection: 'cronJobs' } });
    try {
      agenda.define(`notifySP for bookingID ${bookingData._id}`, async (job, done) => {
        const pendingBooking = await controllers.BookingAssignmentController.pendingBookingForSP(bookingData);
        const criteria = {
          bookingID: bookingData._id,
          forWhom: configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
        };
        if (pendingBooking) {
          const option = {
            lean: true,
            sort: {
              _id: 1,
            },
          };
          projection = {
            users: 1,
            round: 1,
            radius: 1,
          };
          const currentRound = await services.MongoService.getFirstMatch('roundCompletedUser', criteria, projection, option);
          let radius;
          if (!currentRound) {
            radius = bookingFloatSetting.distanceRange;
          } else {
            radius = currentRound.radius;
          }

          const allAvailableUsers = await controllers.BookingAssignmentController.availableSP(headers, bookingData, radius);

          const currentUser = [];

          for (let index = 0; index < allAvailableUsers.length; index += 1) {
            const notifiedUser = JSON.stringify((currentRound && currentRound.users[index]) || '');
            const availableSP = JSON.stringify(allAvailableUsers[index]);
            if (notifiedUser !== availableSP) {
              currentUser.push(allAvailableUsers[index]);
            }
          }
          if ((currentRound && currentRound.round) === reAttempt + 1) {
            await services.MongoService.deleteData('roundCompletedUser', criteria);
            // eslint-disable-next-line no-unused-vars
            agenda.cancel({ name: `notifySP for bookingID ${bookingData._id}` }, (err, numRemoved) => done());
          } else if (currentUser.length > 0) {
            for (let index = 0; index < currentUser.length; index += 1) {
              controllers.BookingAssignmentController.notifySP(currentUser[index], bookingData._id, bookingType);
            }
            if (!currentRound) {
              const newData = {
                bookingID: bookingData._id,
                forWhom: configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
                radius,
                round: 0,
                users: currentUser,
              };
              await services.MongoService.createData('roundCompletedUser', newData);
              return done();
            }
            const newUser = {
              $push: {
                users: { $each: currentUser },
              },
            };
            await services.MongoService.updateData('roundCompletedUser', criteria, newUser, { new: true });
            return done();
          } else {
            const newUser = {
              radius: radius + bookingFloatSetting.increaseDistanceBy,
              $inc: {
                round: 1,
              },
            };
            await services.MongoService.updateData('roundCompletedUser', criteria, newUser, { new: true });
            return done();
          }
        } else {
          await services.MongoService.deleteData('roundCompletedUser', criteria);
          // eslint-disable-next-line no-unused-vars
          agenda.cancel({ name: `notifySP for bookingID ${bookingData._id}` }, (err, numRemoved) => done());
        }
      });

      agenda.on('ready', () => {
        let jobTime = bookingFloatSetting.requestExpiresIn;
        jobTime += ' seconds';
        agenda.every(jobTime, `notifySP for bookingID ${bookingData._id}`);
        agenda.start();
      });
    } catch (error) {
      winstonLogger.error(error);
    }
  }

  /**
   * RRBookingFloatForSP float booking notification for serviceProvider in
   * round robin fashion with reAttempts if not accepted within round expired time.
   * @param {*} headers content-language and authorization headers
   * @param {*} bookingData 
   * @param {*} bookingFloatSetting booking notification algo data
   * @param {*} bookingType type of booking notification
   */
  async function RRBookingFloatForSP(headers, bookingData, bookingFloatSetting, bookingType) {
    const controllers = server.plugins['core-controller'];
    const reAttempt = bookingFloatSetting.reAttempt;
    const agenda = new Agenda({ db: { address: Config.get('/hapiMongoModels/mongodb/uri', { env: process.env.NODE_ENV }), collection: 'cronJobs' } });
    try {
      agenda.define(`notifySP for bookingID ${bookingData._id}`, async (job, done) => {
        const pendingBooking = await controllers.BookingAssignmentController.pendingBookingForSP(bookingData);
        const criteria = {
          bookingID: bookingData._id,
          forWhom: configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
        };
        if (pendingBooking) {
          const option = {
            lean: true,
            sort: {
              _id: 1,
            },
          };
          projection = {
            users: 1,
            round: 1,
            radius: 1,
          };
          const currentRound = await services.MongoService.getFirstMatch('roundCompletedUser', criteria, projection, option);
          let radius;
          if (!currentRound) {
            radius = bookingFloatSetting.distanceRange;
          } else {
            radius = currentRound.radius;
          }
          const allAvailableUsers = await controllers.BookingAssignmentController.availableSP(headers, bookingData, radius);
          let currentUser;

          for (let index = 0; index < allAvailableUsers.length; index += 1) {
            const notifiedUser = JSON.stringify((currentRound && currentRound.users[index]) || '');
            const availableSP = JSON.stringify(allAvailableUsers[index]);
            if (notifiedUser !== availableSP) {
              currentUser = allAvailableUsers[index];
              break;
            }
          }
          if ((currentRound && currentRound.round) === reAttempt + 1) {
            await services.MongoService.deleteData('roundCompletedUser', criteria);
            // eslint-disable-next-line no-unused-vars
            agenda.cancel({ name: `notifySP for bookingID ${bookingData._id}` }, (err, numRemoved) => done());
          } else if (currentUser) {
            controllers.BookingAssignmentController.notifySP(currentUser, bookingData._id, bookingType);
            if (!currentRound) {
              const newData = {
                bookingID: bookingData._id,
                forWhom: configs.AppConfiguration.get('/roles', { role: 'serviceProvider' }),
                radius,
                round: 0,
                users: [currentUser],
              };
              await services.MongoService.createData('roundCompletedUser', newData);
              return done();
            }
            const newUser = {
              $push: {
                users: currentUser,
              },
            };
            await services.MongoService.updateData('roundCompletedUser', criteria, newUser, { new: true });
            return done();
          } else {
            const newUser = {
              radius: radius + bookingFloatSetting.increaseDistanceBy,
              $inc: {
                round: 1,
              },
            };
            await services.MongoService.updateData('roundCompletedUser', criteria, newUser, { new: true });
            return done();
          }
        } else {
          await services.MongoService.deleteData('roundCompletedUser', criteria);
          // eslint-disable-next-line no-unused-vars
          agenda.cancel({ name: `notifySP for bookingID ${bookingData._id}` }, (err, numRemoved) => done());
        }
      });

      agenda.on('ready', () => {
        let jobTime = bookingFloatSetting.requestExpiresIn;
        jobTime += ' seconds';
        agenda.every(jobTime, `notifySP for bookingID ${bookingData._id}`);
        agenda.start();
      });
    } catch (error) {
      winstonLogger.error(error);
    }
  }

  /** *****************************************************************************************
   *                                                                                         *
   *                                                                                         *
   *                   Booking Float Cron for Service Provider --- END                       *
   *                                                                                         *
   *                                                                                         *
   ****************************************************************************************** */


  return {
    controllerName: 'AgendaController',
    broadcastReAttemptForDriver,
    RRBookingFloatForDriver,
    broadcastReAttemptForSP,
    RRBookingFloatForSP,
  };
};
