import Redis from "ioredis";
import { KEY } from "../../config/key";
import logger from "../../config/logger/logger";

interface RedisConfig {
  host: string;
  port: number;
  db: number;
  password?: string;
  username?: string;
}

class RedisService {
  private redis: Redis;
  private isConnected: boolean = false;
  private finalConfig;

  constructor() {
    const config: RedisConfig = {
      host: KEY.redisHost,
      port: KEY.redisPort,
      db: KEY.redisDb
    };
    if (KEY.redisPassword) {
      config.password = KEY.redisPassword;
    }
    this.finalConfig = {
      ...config,
      maxRetriesPerRequest: 3,
      lazyConnect: true, // 改为true，避免阻塞启动
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 100, 3000);
        logger.warn({
          event: "redisReconnecting",
          message: `Redis重连第${times}次，延迟${delay}ms`
        });
        return delay;
      },
      reconnectOnError: (err: any) => {
        const targetErrors = ["READONLY", "ECONNREFUSED", "ETIMEDOUT"];
        return targetErrors.some(error => err.message.includes(error));
      }
    };
  }
  async initializeRedis(): Promise<void> {
    this.redis = new Redis(this.finalConfig);
    this.setupEventListeners();
    await this.redis.connect();
  }

  private setupEventListeners(): void {
    this.redis.on("connect", () => {
      this.isConnected = true;
    });

    this.redis.on("ready", () => {
      this.isConnected = true;
    });

    this.redis.on("error", () => {
      this.isConnected = false;
    });

    this.redis.on("close", () => {
      this.isConnected = false;
    });

    this.redis.on("end", () => {
      this.isConnected = false;
    });
  }

  /**
   * 检查连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        // 尝试连接
        await this.redis.connect();
        return false; // 连接是异步的，返回false让下次检查
      }

      const result = await this.redis.ping();
      return result === "PONG";
    } catch (error: any) {
      logger.error("❌ Redis 连接检查失败:", error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 确保连接可用
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected || !(await this.checkConnection())) {
      throw new Error("Redis 连接不可用");
    }
  }

  // ==================== 基础操作 ====================

  /**
   * 设置键值
   */
  async set(key: string, value: any, ttl?: number): Promise<string> {
    const serialized = JSON.stringify(value);
    return ttl
      ? await this.redis.setex(key, ttl, serialized)
      : await this.redis.set(key, serialized);
  }

  /**
   * 获取键值
   */
  async get(key: string): Promise<any> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<number> {
    return await this.redis.del(key);
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<number> {
    return await this.redis.exists(key);
  }

  /**
   * 设置过期时间
   */
  async expire(key: string, ttl: number): Promise<number> {
    return await this.redis.expire(key, ttl);
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key);
  }

  // ==================== 数值操作 ====================

  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async incrby(key: string, increment: number): Promise<number> {
    return await this.redis.incrby(key, increment);
  }

  async decr(key: string): Promise<number> {
    return await this.redis.decr(key);
  }

  async decrby(key: string, decrement: number): Promise<number> {
    return await this.redis.decrby(key, decrement);
  }

  // ==================== 哈希操作 ====================

  async hset(key: string, field: string, value: any): Promise<number> {
    return await this.redis.hset(key, field, JSON.stringify(value));
  }

  async hget(key: string, field: string): Promise<any> {
    const value = await this.redis.hget(key, field);
    return value ? JSON.parse(value) : null;
  }

  async hgetall(key: string): Promise<Record<string, any>> {
    const hash = await this.redis.hgetall(key);
    const result: Record<string, any> = {};
    for (const [field, value] of Object.entries(hash)) {
      result[field] = JSON.parse(value);
    }
    return result;
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.redis.hdel(key, field);
  }

  async hexists(key: string, field: string): Promise<number> {
    return await this.redis.hexists(key, field);
  }

  async hlen(key: string): Promise<number> {
    return await this.redis.hlen(key);
  }

  // ==================== 列表操作 ====================

  async lpush(key: string, value: any): Promise<number> {
    return await this.redis.lpush(key, JSON.stringify(value));
  }

  async rpush(key: string, value: any): Promise<number> {
    return await this.redis.rpush(key, JSON.stringify(value));
  }

  async lpop(key: string): Promise<any> {
    const value = await this.redis.lpop(key);
    return value ? JSON.parse(value) : null;
  }

  async rpop(key: string): Promise<any> {
    const value = await this.redis.rpop(key);
    return value ? JSON.parse(value) : null;
  }

  async llen(key: string): Promise<number> {
    return await this.redis.llen(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    const values = await this.redis.lrange(key, start, stop);
    return values.map(value => JSON.parse(value));
  }

  // ==================== 集合操作 ====================

  async sadd(key: string, member: any): Promise<number> {
    return await this.redis.sadd(key, JSON.stringify(member));
  }

  async srem(key: string, member: any): Promise<number> {
    return await this.redis.srem(key, JSON.stringify(member));
  }

  async sismember(key: string, member: any): Promise<number> {
    return await this.redis.sismember(key, JSON.stringify(member));
  }

  async smembers(key: string): Promise<any[]> {
    const members = await this.redis.smembers(key);
    return members.map(member => JSON.parse(member));
  }

  async scard(key: string): Promise<number> {
    return await this.redis.scard(key);
  }

  // ==================== 有序集合操作 ====================

  async zadd(key: string, score: number, member: any): Promise<number> {
    return await this.redis.zadd(key, score, JSON.stringify(member));
  }

  async zrem(key: string, member: any): Promise<number> {
    return await this.redis.zrem(key, JSON.stringify(member));
  }

  async zscore(key: string, member: any): Promise<string | null> {
    return await this.redis.zscore(key, JSON.stringify(member));
  }

  async zrank(key: string, member: any): Promise<number | null> {
    return await this.redis.zrank(key, JSON.stringify(member));
  }

  async zrevrank(key: string, member: any): Promise<number | null> {
    return await this.redis.zrevrank(key, JSON.stringify(member));
  }

  async zrange(key: string, start: number, stop: number): Promise<any[]> {
    const members = await this.redis.zrange(key, start, stop);
    return members.map(member => JSON.parse(member));
  }

  async zrevrange(key: string, start: number, stop: number): Promise<any[]> {
    const members = await this.redis.zrevrange(key, start, stop);
    return members.map(member => JSON.parse(member));
  }

  async zcard(key: string): Promise<number> {
    return await this.redis.zcard(key);
  }

  // ==================== 发布订阅 ====================

  async publish(channel: string, message: any): Promise<number> {
    return await this.redis.publish(channel, JSON.stringify(message));
  }

  async subscribe(
    channel: string,
    callback: (message: any) => void
  ): Promise<Redis> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(channel);

    subscriber.on("message", (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(JSON.parse(message));
      }
    });

    return subscriber;
  }

  // ==================== 批量操作 ====================

  async mset(
    keyValuePairs: Record<string, any>,
    ttl?: number
  ): Promise<string> {
    const serializedPairs: string[] = [];
    for (const [key, value] of Object.entries(keyValuePairs)) {
      serializedPairs.push(key, JSON.stringify(value));
    }

    const result = await this.redis.mset(...serializedPairs);

    if (ttl) {
      const pipeline = this.redis.pipeline();
      for (const key of Object.keys(keyValuePairs)) {
        pipeline.expire(key, ttl);
      }
      await pipeline.exec();
    }

    return result;
  }

  async mget(keys: string[]): Promise<any[]> {
    const values = await this.redis.mget(...keys);
    return values.map(value => (value ? JSON.parse(value) : null));
  }

  async mdel(keys: string[]): Promise<number> {
    return await this.redis.del(...keys);
  }

  // ==================== 工具方法 ====================

  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async info(): Promise<Record<string, string>> {
    const info = await this.redis.info();
    const lines = info.split("\r\n");
    const result: Record<string, string> = {};

    for (const line of lines) {
      if (line && !line.startsWith("#")) {
        const [key, value] = line.split(":");
        if (key && value) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  async flushdb(): Promise<string> {
    return await this.redis.flushdb();
  }

  async flushall(): Promise<string> {
    return await this.redis.flushall();
  }

  getConnectionStatus(): string {
    return this.redis.status;
  }

  async disconnect(): Promise<void> {
    this.redis.disconnect();
  }

  async reconnect(): Promise<void> {
    await this.redis.connect();
  }
}

export default new RedisService();
