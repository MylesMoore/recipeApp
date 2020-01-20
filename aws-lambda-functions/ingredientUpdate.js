'use strict';
const AWS = require('aws-sdk');
const uuidv4 = require('uuid');

AWS.config.update({ region: 'us-west-2'});

exports.handler = async (event, context) => {
  const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' });
  const recordUuid = uuidv4();
  let responseBody = "";
  let statusCode = 0;
  let { uuid, name, juiceColor, juicingCoeff, preparationCoeff, surfaceColor, unitCost } = JSON.parse(event.body);
  if (uuid === "new") {
    uuid = recordUuid;
  }
  const params = {
    TableName: "Ingredients", 
    Key: {
      uuid: uuid
    },
    UpdateExpression: "set #name = :n, juiceColor = :o, juicingCoeff = :p, preparationCoeff = :q, surfaceColor = :r, unitCost = :s",
    ExpressionAttributeValues: {
      ":n": name,
      ":o": juiceColor,
      ":p": juicingCoeff,
      ":q": preparationCoeff,
      ":r": surfaceColor,
      ":s": unitCost
    },
    ExpressionAttributeNames: {
      "#name": "name"
    },
    ReturnValues: "UPDATED_NEW"
  };
  
  try {
    const data = await documentClient.update(params).promise();
    responseBody = JSON.stringify(data);
    statusCode = 201;
  } catch(err) {
    responseBody = `Unable to update ingredient: ${err}`;
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