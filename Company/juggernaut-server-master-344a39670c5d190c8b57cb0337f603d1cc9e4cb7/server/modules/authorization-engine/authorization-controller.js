/* eslint-disable no-console */
const fs = P.promisifyAll(require('fs'));
const Boom = require('boom');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const utilityFunctions = server.plugins['core-utility-functions'];

  async function addPermission(headers, payloadData, userRole) {
    try {
      const path = payloadData.method.toLowerCase() + payloadData.apiPath;
      const criteria = {
        uniqueApiPath: path,
      };
      const roleData = [];
      for (let i = 0; i < payloadData.roleAccess.length; i += 1) {
        roleData[i] = {
          role: payloadData.roleAccess[i],
          completeAccess: payloadData.completeAccess,
          objectRights: payloadData.objectRights || [],
        };
      }
      const dataToSave = {
        uniqueApiPath: path,
        roleAccess: roleData,
        alias: payloadData.alias,
        permissionName: payloadData.permissionName,
        allowedToUpdate: payloadData.allowedToUpdate,
      };
      const options = {
        new: true,
        upsert: true,
      };
      const projections = {};
      const data = await services.MongoService.getFirstMatch('Authorization', criteria, projections, { limit: 1 });
      const allowedUser = data && data.allowedToUpdate.indexOf(userRole);
      if ((allowedUser < 0 || (allowedUser === null)) && userRole !== configs.UserConfiguration.get('/roles', { role: 'admin' })) {
        throw Boom.forbidden(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NOT_AUTHORIZED_TO_UPDATE' }));
      }
      const updateData = await services.MongoService.updateData('Authorization', criteria, dataToSave, options);
      if (updateData) {
        const key = updateData.uniqueApiPath;
        const value = JSON.stringify({ permission: updateData.roleAccess });
        await services.RedisService.setData(key, value);
        const newData = await services.RedisService.getData(key);
        return utilityFunctions.universalFunction.sendSuccess(headers, JSON.parse(newData));
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getPermission(headers, queryData) {
    try {
      const path = queryData.method.toLowerCase() + queryData.apiPath;
      const data = await services.RedisService.getData(path);
      return utilityFunctions.universalFunction.sendSuccess(headers, JSON.parse(data));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getAllPermissions(headers, queryData) {
    try {
      const criteria = {};
      const projections = {};
      const options = {
        limit: queryData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: queryData.skip || 0,
        sort: {
          _id: -1,
        },
        lean: true,
      };
      const data = await services.MongoService.getDataAsync('Authorization', criteria, projections, options);
      return utilityFunctions.universalFunction.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function updatePermissionAtRunTime() {
    try {
      const fileData = await fs.readFileAsync(`${__dirname}/authorization.json`, 'utf8');
      const json = JSON.parse(fileData);
      json.forEach(async (permission) => {
        const criteria = {
          uniqueApiPath: permission.uniqueApiPath,
        };
        const options = {
          new: true,
          upsert: true,
        };
        const data = await services.MongoService.countData('Authorization', criteria);
        if (data > 0) {
          return true;
        }
        const updateData = await services.MongoService.updateData('Authorization', criteria, permission, options);
        if (updateData) {
          const key = updateData.uniqueApiPath;
          const value = JSON.stringify({ permission: updateData.roleAccess });
          await services.RedisService.setData(key, value);
          return true;
        }
      }, this);
    } catch (error) {
      winstonLogger.error(error);
      throw error;
    }
  }
  // eslint-disable-next-line no-unused-vars
  updatePermissionAtRunTime().then((result) => {
  }).catch((error) => {
    winstonLogger.error('Unable to add permission to the system, exiting process', error);
    process.exit(1);
  });

  async function specificRolePermission(headers, payloadData, userRole) {
    try {
      const path = payloadData.method.toLowerCase() + payloadData.apiPath;
      const criteria = {
        uniqueApiPath: path,
      };
      const projections = {};
      const options = {
        lean: true,
      };
      const data = await services.MongoService.getFirstMatch('Authorization', criteria, projections, options);
      const allowedUser = data && data.allowedToUpdate.indexOf(userRole);
      if (allowedUser < 0 || (allowedUser === null)) {
        throw Boom.forbidden(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'NOT_AUTHORIZED_TO_UPDATE' }));
      }
      const allowedRoles = data.roleAccess;
      let alreadyAvailable = false;
      for (let i = 0; i < allowedRoles.length; i += 1) {
        if (allowedRoles[i].role === payloadData.role) {
          alreadyAvailable = true;
        }
      }
      let filterCriteria;
      let dataToUpdate;
      if (alreadyAvailable) {
        filterCriteria = {
          uniqueApiPath: path,
          roleAccess: {
            $elemMatch: {
              role: payloadData.role,
            },
          },
        };
        dataToUpdate = {
          'roleAccess.$.role': payloadData.role,
          'roleAccess.$.completeAccess': payloadData.completeAccess,
          'roleAccess.$.objectRights': payloadData.objectRights || [],
        };
      } else {
        filterCriteria = {
          uniqueApiPath: path,
        };
        dataToUpdate = {
          $push: {
            roleAccess: {
              role: payloadData.role,
              completeAccess: payloadData.completeAccess,
              objectRights: payloadData.objectRights || [],
            },
          },
        };
      }
      const option = {
        new: true,
      };
      const updateData = await services.MongoService.updateData('Authorization', filterCriteria, dataToUpdate, option);
      if (updateData) {
        const key = updateData.uniqueApiPath;
        const value = JSON.stringify({ permission: updateData.roleAccess });
        await services.RedisService.setData(path, value);
        const newData = await services.RedisService.getData(key);
        return utilityFunctions.universalFunction.sendSuccess(headers, JSON.parse(newData));
      }
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  async function getRoleWisePermission(userRole) {
    try {
      const criteria = {
        roleAccess: {
          $elemMatch: {
            role: userRole,
          },
        },
      };
      const projections = {};
      const data = await services.MongoService.getDataAsync('Authorization', criteria, projections);
      return data;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'AclController',
    addPermission,
    getPermission,
    getAllPermissions,
    specificRolePermission,
    getRoleWisePermission,
  };
};
