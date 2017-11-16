const internals = {};

// eslint-disable-next-line no-unused-vars
exports.load = internals.controller = (server) => {
  // Update record in DB
  async function updateData(modelName, criteria, dataToSet, options) {
    const Models = server.plugins['core-models'];
    return Models[modelName].findOneAndUpdateAsync(criteria, dataToSet, options);
  }


  async function getDataAsync(modelName, criteria, projection, options) {
    const Models = server.plugins['core-models'];
    return Models[modelName].findAsync(criteria, projection, options);
  }

  async function getFirstMatch(modelName, criteria, projection, options) {
    const Models = server.plugins['core-models'];
    return Models[modelName].findOneAsync(criteria, projection, options);
  }


  async function countData(modelName, criteria) {
    const Models = server.plugins['core-models'];
    return Models[modelName].countAsync(criteria);
  }

  // Insert record in DB
  async function createData(modelName, objToSave) {
    const Models = server.plugins['core-models'];
    return new Models[modelName](objToSave).saveAsync();
  }

  // Delete record in DB
  async function deleteData(modelName, criteria) {
    const Models = server.plugins['core-models'];
    return Models[modelName].findOneAndRemoveAsync(criteria);
  }

  async function deleteMany(modelName, criteria) {
    const Models = server.plugins['core-models'];
    return Models[modelName].deleteManyAsync(criteria);
  }

  async function aggregateData(modelName, criteria) {
    const Models = server.plugins['core-models'];
    return Models[modelName].aggregateAsync(criteria);
  }

  // Insert record in DB
  const insertData = function (modelName, objToSave) {
    const Models = server.plugins['core-models'];
    return new Models[modelName](objToSave).insertAsync();
  };

  async function updateMultiple(modelName, criteria, dataToSet, options) {
    options.multi = true;
    const Models = server.plugins['core-models'];
    return Models[modelName].updateAsync(criteria, dataToSet, options);
  }

  return {
    serviceName: 'MongoService',
    insertData,
    createData,
    updateData,
    deleteData,
    countData,
    aggregateData,
    deleteMany,
    updateMultiple,
    getDataAsync,
    getFirstMatch,
  };
};
