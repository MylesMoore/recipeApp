'use strict';
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-2'});

exports.handler = async (event, context) => {
  const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' });
  
  let responseBody = "";
  let statusCode = 0;
  
  const params = {
    TableName: "Recipes"
  };  
  try {
    const data = await documentClient.scan(params).promise();
    responseBody = JSON.stringify(data.Items);
    statusCode = 200;
  } catch(err) {
    responseBody = `Unable to get recipes data: ${err}`;
    statusCode = 403;
  }
  
  const response = {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
      "access-control-allow-origin": "*"
    },
    body: responseBody
  };
  
  return response;
};