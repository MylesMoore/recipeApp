'use strict';
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-2'});

exports.handler = async (event, context) => {
  const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' });
  let responseBody = "";
  let statusCode = 0;
  const{ name, uuid, notes, ingredients, rating } = JSON.parse(event.body);
    
  const params = {
    TableName: "Recipes", 
    Key: {
      uuid: uuid
    },
    UpdateExpression: "set #name = :n, notes = :m, ingredients = :o, rating = :p",
    ExpressionAttributeValues: {
      ":n": name,
      ":m": notes,
      ":o": ingredients,
      ":p": rating
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
    responseBody = `Unable to update recipe: ${err}`;
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