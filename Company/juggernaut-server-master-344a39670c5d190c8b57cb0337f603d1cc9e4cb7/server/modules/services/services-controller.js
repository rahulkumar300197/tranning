const Boom = require('boom');
const Promise = require('bluebird');

const internals = {};

exports.load = internals.controller = (server) => {
  const configs = server.plugins['core-config'];
  const services = server.plugins['core-services'];
  const controllers = server.plugins['core-controller'];
  const utilityFunctions = server.plugins['core-utility-functions'];
  const universalFunctions = utilityFunctions.universalFunction;

  /**
   * @function <b>upload</b><br> Method for uploading file to S3 bucket and returning  thumbnail
   * @param {Object} payloadData  Object Containing file details
   */

  async function upload(file) {
    if (file && file.filename) {
      const iconUpload = await services.S3Bucket.uploadFileToS3WithThumbnail(file);
      return iconUpload[1];
    }
  }

  /**
   * @function <b>uniqueCategoryName</b><br> Method for checking uniqueness of categoryName & parentID
   * @param {Object} payloadData  Object Containing category details
   */

  async function uniqueCategoryName(payloadData) {
    const criteria = {
      categoryName: payloadData.categoryName,
      parentID: payloadData.parentID || null,
      isDeleted: false,
    };
    const options = {
      lean: true,
    };
    const data = await services.MongoService.getFirstMatch('Category', criteria, {}, options);
    return data;
  }

  /**
   * @function <b>uniqueServiceName</b><br> Method for checking uniqueness of serviceName & parentID
   * @param {Object} payloadData  Object Containing category details
   */


  async function uniqueServiceName(payloadData) {
    const criteria = {
      serviceName: payloadData.serviceName,
      parentID: payloadData.parentID || null,
    };
    const options = {
      lean: true,
    };
    const data = await services.MongoService.getFirstMatch('Service', criteria, {}, options);
    return data;
  }
  /**
   * @function <b>checkParent</b><br> Method for checking if parent category exist
   * @param {Object} payloadData  Object Containing category details
   */

  async function checkParent(parentCategory) {
    try {
      if (parentCategory) {
        const criteria = {
          _id: parentCategory,
        };
        const options = {
          lean: true,
        };
        const data = await services.MongoService.getFirstMatch('Category', criteria, {}, options);
        return data;
      }
      return 0;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>Add Category</b><br> Method for adding new category/sub category
   * @param {Object} payloadData  Object Containing category details
   */

  async function addCategory(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const options = {
        lean: true,
      };
      const preCondition = Promise.join(upload(payloadData.icon), uniqueCategoryName(payloadData), (uploadData, categoryData) => {
        if (uploadData) {
          payloadData.icon = uploadData;
        }
        if (categoryData) {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CATEGORY_EXIST' }));
        }
      }
      );
      await preCondition;
      if (payloadData.parentID) {
        const criteria = {
          _id: payloadData.parentID,
        };
        const checkCatParent = await services.MongoService.getFirstMatch('Category', criteria, {}, options);
        if (checkCatParent) {
          const dataToUpdate = {
            hasChild: true,
          };
          await services.MongoService.updateData('Category', criteria, dataToUpdate, options);
          const data = await services.MongoService.createData('Category', payloadData);
          return universalFunctions.sendSuccess(headers, data);
        }

        payloadData.parentID = null;
        const data = await services.MongoService.createData('Category', payloadData);
        return universalFunctions.sendSuccess(headers, data);
      }

      const data = await services.MongoService.createData('Category', payloadData);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>Get all Category</b><br> Method for paginated listing of categories
   * @param {Object} payloadData  Object Containing filters for displaying categories
   */
  async function getAllCategory(headers, payloadData) {
    try {
      const criteria = {};
      const options = {
        limit: payloadData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: payloadData.skip || 0,
        sort: {
          _id: -1,
        },
      };
      if (payloadData.parentID === 'null' || payloadData.parentID === 'NULL') {
        criteria.parentID = null;
      } else if (payloadData.parentID) {
        criteria.parentID = payloadData.parentID;
      }

      if (payloadData.isDeleted !== 'all') {
        criteria.isDeleted = payloadData.isDeleted;
      }
      const data = await services.MongoService.getDataAsync('Category', criteria, {}, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>Update Category</b><br> Method for updating of category
   * @param {Object} payloadData  Object Containing category details that is to be updated
   */

  async function updateCategory(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.categoryID,
      };
      const projection = {};
      const options = {
        lean: true,
      };
      const checkCatExist = await services.MongoService.getFirstMatch('Category', criteria, projection, options);
      if (checkCatExist) {
        if (checkCatExist.isDeleted) {
          throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'TASK_NOT_FOUND' }));
        }
        //  const newCriteria = {
        //    categoryName: payloadData.categoryName,
        //    parentID: payloadData.parentID || null,
        //  };
        const categoryData = await uniqueCategoryName(payloadData);
        if (categoryData && (payloadData.categoryID !== categoryData._id.toString())) {
          throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CATEGORY_EXIST' }));
        }
        delete payloadData.categoryID;
        if (payloadData.icon && payloadData.icon.filename) {
          payloadData.icon = upload(payloadData.icon);
        }
        options.new = true;
        const data = await services.MongoService.updateData('Category', criteria, payloadData, options);
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CATEGORY_NOT_EXIST' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
    * @function <b>Delete service</b><br> Method for deleting all services under a category
    * @param {Object} catID  Object Containing parent category details
    */
  async function deleteServiceChild(catID, dataToUpdate) {
    try {
      const criteria = {
        parentCategory: catID,
      };
      const options = {
        multi: true,
        new: true,
      };
      const deleteServices = await services.MongoService.updateData('Service', criteria, dataToUpdate, options);
      if (deleteServices) {
        const deleteSchedule = await controllers.ScheduleController.deleteSchedule(deleteServices._id, dataToUpdate);
        if (deleteSchedule) {
          return 0;
        }
      }
      return 0;
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
   * @function <b>Delete Child  </b><br> Method for deleting all sub categories under a parent category
   * @param {Object} payloadData  Object Containing parent category details
   */
  async function deleteChild(catID, dataToUpdate) {
    try {
      const criteria = {
        parentID: catID,
      };
      const options = {
        new: true,
      };
      const child = await services.MongoService.getDataAsync('Category', criteria, {}, {});
      if (child) {
        Promise.map(child, async (eachChild) => {
          const criteria2 = {
            _id: eachChild._id,
          };
          const updatedData = await services.MongoService.updateData('Category', criteria2, dataToUpdate, options);
          if (updatedData.hasChild) {
            await deleteChild(updatedData._id, dataToUpdate);
          }
          return deleteServiceChild(updatedData._id, dataToUpdate);
        }).then(() => 0);
      }
    } catch (error) {
      winstonLogger.error(error);
      return 1;
    }
  }


  /**
   * @function <b>Delete category</b><br> Method for deleting a category along with all its sub categories and services
   * @param {Object} payloadData  Object Containing category details
   */

  async function deleteCategory(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.categoryID,
      };
      const dataToUpdate = {
        isDeleted: payloadData.isDeleted,
      };
      const options = {
        new: true,
      };
      const data = await services.MongoService.updateData('Category', criteria, dataToUpdate, options);
      if (!data) {
        throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CATEGORY_NOT_EXIST' }));
      }
      if (data.hasChild) {
        await deleteChild(data._id, dataToUpdate);
      }
      await deleteServiceChild(payloadData.categoryID, dataToUpdate);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>Add new service</b><br> Method to register new service
   * @param {Object} payloadData  Object Containing service details
   */
  async function addService(headers, payloadData) {
    const lang = headers['content-language'];
    try {
      const preCondition = Promise.join(checkParent(payloadData.parentCategory), uniqueServiceName(payloadData), upload(payloadData.imageUrl),
        (categoryData, serviceData, uploadData) => {
          if (!categoryData || categoryData.isDeleted) {
            throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CATEGORY_NOT_EXIST' }));
          }
          if (serviceData) {
            throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_EXIST' }));
          }
          if (uploadData) {
            payloadData.imageUrl = uploadData;
          }
        });
      await preCondition;
      const data = await services.MongoService.createData('Service', payloadData);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
   * @function <b>Delete service</b><br> Method to delete a service
   * @param {Object} payloadData  Object Containing service details
   */
  async function deleteService(headers, payloadData) {
    try {
      const criteria = {
        _id: payloadData.serviceID,
      };
      const dataToUpdate = {
        isDeleted: payloadData.isDeleted,
      };
      const options = {
        new: true,
      };
      const data = await services.MongoService.updateData('Service', criteria, dataToUpdate, options);
      await controllers.ScheduleController.deleteSchedule(payloadData.serviceID, dataToUpdate);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
   * @function <b>Update service</b><br> Method for updating service details
   * @param {Object} payloadData  Object Containing service details that is to be updated
   */
  async function updateService(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const preCondition = Promise.join(checkParent(payloadData.parentCategory), uniqueServiceName(payloadData), upload(payloadData.imageUrl),
        (categoryData, serviceData, uploadData) => {
          if (categoryData === undefined || categoryData === null || categoryData.isDeleted) {
            throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'CATEGORY_NOT_EXIST' }));
          }

          if (serviceData && (payloadData.serviceID !== serviceData._id.toString())) {
            throw Boom.badRequest(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_EXIST' }));
          }
          if (uploadData) {
            payloadData.imageUrl = uploadData;
          }
        });
      await preCondition;
      const criteria = {
        _id: payloadData.serviceID,
      };
      delete payloadData.serviceID;
      const options = {
        new: true,
      };
      const data = await services.MongoService.updateData('Service', criteria, payloadData, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
   * @function <b>Get all service</b><br> Method for listing all services
   * @param {Object} payloadData  Object Containing service details for filtering
   */
  async function getAllService(headers, payloadData) {
    try {
      const criteria = {};
      const options = {
        limit: payloadData.limit || configs.AppConfiguration.get('/DATABASE', { DATABASE: 'LIMIT' }),
        skip: payloadData.skip || 0,
        sort: {
          _id: -1,
        },
      };
      if (payloadData.parentCategory) {
        criteria.parentCategory = payloadData.parentCategory;
      }
      if (payloadData.isDeleted !== 'all') {
        criteria.isDeleted = payloadData.isDeleted;
      }

      if (payloadData.isApproved !== 'all') {
        criteria.serviceProviders = {
          $elemMatch: {
            isApproved: payloadData.isApproved,
          },
        };
      }
      const data = await services.MongoService.getDataAsync('Service', criteria, {}, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  /**
   * @function <b>Register for service</b><br> Method for registering SP under a service
   * @param {Object} payloadData  Object Containing service and SP details
   */

  async function registerForService(headers, payloadData, userData) {
    try {
      const lang = headers['content-language'];
      const userID = userData.user._id;
      const criteria = {
        _id: payloadData.serviceID,
        serviceProviders: {
          $elemMatch: {
            serviceProviderID: userID,
          },
        },
      };
      const serviceData = await services.MongoService.getFirstMatch('Service', criteria, {}, {});
      if (serviceData) {
        if (serviceData.isDeleted) {
          throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_NOT_EXIST' }));
        }
        throw Boom.conflict(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'SERVICE_ALREADY_REGISTERED' }));
      }
      const updateCriteria = {
        _id: payloadData.serviceID,
        isDeleted: false,
      };
      const dataToSave = {
        $push: {
          serviceProviders: {
            serviceProviderID: userID,
          },
        },
      };
      const options = {
        new: true,
      };
      const data = await services.MongoService.updateData('Service', updateCriteria, dataToSave, options);
      return universalFunctions.sendSuccess(headers, data);
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }


  /**
   * @function <b>Approve service request</b><br> Method for approving SP under a service
   * @param {Object} payloadData  Object Containing service details
   */
  async function approveServiceRequest(headers, payloadData) {
    try {
      const lang = headers['content-language'];
      const criteria = {
        _id: payloadData.serviceID,
        isDeleted: false,
        serviceProviders: {
          $elemMatch: {
            serviceProviderID: payloadData.userID,
          },
        },
      };
      const serviceData = await services.MongoService.getFirstMatch('Service', criteria, {}, {});
      if (serviceData) {
        const dataToSave = {
          'serviceProviders.$.isApproved': payloadData.isApproved,
        };
        const options = {
          new: true,
        };
        const data = await services.MongoService.updateData('Service', criteria, dataToSave, options);
        return universalFunctions.sendSuccess(headers, data);
      }
      throw Boom.notFound(configs.MessageConfiguration.get('/lang', { locale: lang, message: 'EITHER_SERVICE_NOT_EXIST_OR_USER_NOT_REGISTERED' }));
    } catch (error) {
      winstonLogger.error(error);
      return error;
    }
  }

  return {
    controllerName: 'ServiceController',
    addCategory,
    getAllCategory,
    updateCategory,
    deleteCategory,
    addService,
    updateService,
    deleteService,
    getAllService,
    registerForService,
    approveServiceRequest,
  };
};
