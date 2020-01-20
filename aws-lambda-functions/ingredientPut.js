'use strict';
const uuidv4 = require('uuid');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-2'});

exports.handler = async (event, context) => {
  const ddb = new AWS.DynamoDB({ apiVersion:'2012-10-08' });
  const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' });
  const recordUuid = uuidv4();
  let responseBody = "";
  let statusCode = 0;
  const{ name } = JSON.parse(event.body);
  const params = {
    TableName: "Ingredients", 
    Item: {
      uuid: recordUuid,
      name: name,
      juiceColor: "_ not set _",
      unitCost: 0,
      preparationCoeff: 1,
      juicingCoeff: 1,
      surfaceColor: "_ not set _"
    }
  };  
  
  try {
    const data = await documentClient.put(params).promise();
    responseBody = JSON.stringify(data);
    statusCode = 201;
  } catch(err) {
    responseBody = `Unable to put product: ${err}`;
    statusCode = 403;
  }
  
  const response = {
    statusCode: statusCode, 
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }, 
    body: responseBody
  };
  return response;
  
};
