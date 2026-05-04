import { createClient } from 'redis';

const useRedis = process.env.USE_REDIS === 'true';

let redisClient;

if (!useRedis) {
    console.warn("REDIS_DISABLED: USE_REDIS is set to false in .env. Using mock Redis client.");
    // Mock client to prevent errors in controllers
    redisClient = {
        connect: async () => console.log("Mock Redis connected (No-op)"),
        get: async () => null,
        set: async () => 'OK',
        del: async () => 0,
        on: () => {},
        quit: async () => {},
    };
} else {
    redisClient = createClient({
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT) || 6379,
            reconnectStrategy: (retries) => {
                if (retries > 5) {
                    console.error('Redis connection failed after 5 attempts. Bypassing Redis.');
                    return new Error('Redis max retries reached');
                }
                return Math.min(retries * 200, 2000);
            }
        }
    });

    redisClient.on('error', err => {
        console.error('Redis Client Error:', err.message);
    });
}

export default redisClient;