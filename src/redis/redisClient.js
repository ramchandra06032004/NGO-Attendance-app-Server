import { createClient } from 'redis';

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-12132.crce280.asia-south1-1.gcp.cloud.redislabs.com',
        port: 12132
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

export default redisClient;