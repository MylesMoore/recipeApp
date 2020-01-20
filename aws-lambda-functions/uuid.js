const uuidv4 = require('uuid');

exports.handler = async (event) => {
  const recordUuid = uuidv4();
  console.log("recordUuid - " + recordUuid);
};