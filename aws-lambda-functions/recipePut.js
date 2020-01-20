'use strict';
const uuidv4 = require('uuid');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-west-2'});

exports.handler = async (event, context) => {
  const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'us-west-2' });
  const recordUuid = uuidv4();
  let responseBody = "";
  let statusCode = 0;
  const{ name, creatorId } = JSON.parse(event.body);
  const params = {
    TableName: "Recipes", 
    Item: {
      uuid: recordUuid,
      name: name,
      rating: 0,
      ingredients: [],
      notes: "_ not set _",
      creatorId: creatorId
    }
  };  
  
  try {
    const data = await documentClient.put(params).promise();
    responseBody = JSON.stringify(data);
    statusCode = 201;
  } catch(err) {
    responseBody = `Unable to put recipe: ${err}`;
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