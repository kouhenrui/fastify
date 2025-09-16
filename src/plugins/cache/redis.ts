import { FastifyPluginAsync } from "fastify";
import Redis, { RedisOptions } from "ioredis";
import { logger } from "../../config/logger.js";
import fp from "fastify-plugin";
// Redis 连接选项接口
interface RedisPluginOptions {
  host: string;
  port: number;
  password?: string | undefined;
  username?: string | undefined;
  db?: number;
  options?: RedisOptions;
}

// Redis 插件
const redisPlugin: FastifyPluginAsync<RedisPluginOptions> = async (
  fastify,
  options
) => {
  const {
    host,
    port,
    password,
    username,
    db = 0,
    options: redisOptions = {},
  } = options;

  // 默认连接选项
  const defaultOptions: RedisOptions = {
    host,
    port,
    ...(username && { username }),
    ...(password && { password }),
    db,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    ...redisOptions,
  };

  // 创建 Redis 客户端
  const redis = new Redis(defaultOptions);

  // 连接 Redis
  try {
    await redis.connect();

    // 监听连接事件
    redis.on("connect", () => {
      logger.info("Redis 已连接");
    });

    redis.on("ready", () => {
      logger.info("Redis 已就绪");
    });

    redis.on("error", (error) => {
      logger.error("Redis 连接错误", { error: error.message });
    });

    redis.on("close", () => {
      logger.warn("Redis 连接关闭");
    });

    redis.on("reconnecting", () => {
      logger.info("Redis 重新连接中...");
    });


    // 优雅关闭
    fastify.addHook("onClose", async () => {
      await redis.quit();
      logger.info("Redis 连接已关闭");
    });

    // 将 Redis 实例添加到 fastify 实例
    fastify.decorate("redis", redis);

    // 添加 Redis 工具方法
    fastify.decorate("cache", {
      /**
       * 设置键值对
       * @param key 键名
       * @param value 值（自动JSON序列化）
       * @param ttl 过期时间（秒），可选
       * @returns 操作结果
       */
      set: async (key: string, value: any, ttl?: number) => {
        const serialized = JSON.stringify(value);
        if (ttl) {
          return await redis.setex(key, ttl, serialized);
        }
        return await redis.set(key, serialized);
      },

      /**
       * 获取键值
       * @param key 键名
       * @returns 值（自动JSON反序列化），不存在返回null
       */
      get: async (key: string) => {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
      },

      /**
       * 删除键
       * @param key 键名
       * @returns 删除的键数量
       */
      del: async (key: string) => {
        return await redis.del(key);
      },

      /**
       * 检查键是否存在
       * @param key 键名
       * @returns 存在返回1，不存在返回0
       */
      exists: async (key: string) => {
        return await redis.exists(key);
      },

      /**
       * 设置键的过期时间
       * @param key 键名
       * @param ttl 过期时间（秒）
       * @returns 设置成功返回1，失败返回0
       */
      expire: async (key: string, ttl: number) => {
        return await redis.expire(key, ttl);
      },

      /**
       * 获取键的剩余过期时间
       * @param key 键名
       * @returns 剩余秒数，-1表示永不过期，-2表示键不存在
       */
      ttl: async (key: string) => {
        return await redis.ttl(key);
      },

      /**
       * 键值自增1
       * @param key 键名
       * @returns 自增后的值
       */
      incr: async (key: string) => {
        return await redis.incr(key);
      },

      /**
       * 键值按指定数值自增
       * @param key 键名
       * @param increment 自增值
       * @returns 自增后的值
       */
      incrby: async (key: string, increment: number) => {
        return await redis.incrby(key, increment);
      },

      /**
       * 键值自减1
       * @param key 键名
       * @returns 自减后的值
       */
      decr: async (key: string) => {
        return await redis.decr(key);
      },

      /**
       * 键值按指定数值自减
       * @param key 键名
       * @param decrement 自减值
       * @returns 自减后的值
       */
      decrby: async (key: string, decrement: number) => {
        return await redis.decrby(key, decrement);
      },

      // ==================== 哈希操作 ====================

      /**
       * 设置哈希字段值
       * @param key 哈希键名
       * @param field 字段名
       * @param value 字段值（自动JSON序列化）
       * @returns 新增字段数
       */
      hset: async (key: string, field: string, value: any) => {
        const serialized = JSON.stringify(value);
        return await redis.hset(key, field, serialized);
      },

      /**
       * 获取哈希字段值
       * @param key 哈希键名
       * @param field 字段名
       * @returns 字段值（自动JSON反序列化），不存在返回null
       */
      hget: async (key: string, field: string) => {
        const value = await redis.hget(key, field);
        return value ? JSON.parse(value) : null;
      },

      /**
       * 获取哈希所有字段和值
       * @param key 哈希键名
       * @returns 所有字段值对象（自动JSON反序列化）
       */
      hgetall: async (key: string) => {
        const hash = await redis.hgetall(key);
        const result: Record<string, any> = {};
        for (const [field, value] of Object.entries(hash)) {
          result[field] = JSON.parse(value);
        }
        return result;
      },

      /**
       * 删除哈希字段
       * @param key 哈希键名
       * @param field 字段名
       * @returns 删除的字段数
       */
      hdel: async (key: string, field: string) => {
        return await redis.hdel(key, field);
      },

      /**
       * 检查哈希字段是否存在
       * @param key 哈希键名
       * @param field 字段名
       * @returns 存在返回1，不存在返回0
       */
      hexists: async (key: string, field: string) => {
        return await redis.hexists(key, field);
      },
    });
  } catch (error) {
    logger.error("Redis 连接失败", {
      error: error instanceof Error ? error.message : "Unknown error",
      host,
      port,
      db,
    });
    throw error;
  }
};

// 类型声明
declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
    cache: {
      // 基础操作
      set: (key: string, value: any, ttl?: number) => Promise<string | null>;
      get: (key: string) => Promise<any>;
      del: (key: string) => Promise<number>;
      exists: (key: string) => Promise<number>;
      expire: (key: string, ttl: number) => Promise<number>;
      ttl: (key: string) => Promise<number>;

      // 自增/自减操作
      incr: (key: string) => Promise<number>;
      incrby: (key: string, increment: number) => Promise<number>;
      decr: (key: string) => Promise<number>;
      decrby: (key: string, decrement: number) => Promise<number>;
    };
  }
}

export default fp(redisPlugin, {
  name: "redis",
});
