const redis = require('redis');
const logger = require('./logger');
require("dotenv").config();

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
    pingInterval: 1000,
  },
  password: process.env.REDIS_CREDENTIALS,
});

(async () => {
  await redisClient.connect();
})();

logger.info('Connecting to the Redis');

redisClient.on('ready', () => {
  logger.info('Connected!');
});

redisClient.on('error', (err) => {
  logger.info('Redis Client Error', err);
});

module.exports = { redisClient };
