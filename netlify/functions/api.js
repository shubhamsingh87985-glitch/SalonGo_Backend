const serverless = require('serverless-http');
const app = require('../../src/app');
const connectDB = require('../../src/config/db');

let connectionPromise;

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  connectionPromise = connectionPromise || connectDB();
  await connectionPromise;
  return serverless(app)(event, context);
};
