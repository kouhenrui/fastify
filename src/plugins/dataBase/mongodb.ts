import { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import { logger } from '../../config/logger.js';

// MongoDB 连接选项接口
interface MongoOptions {
  uri: string;
  user?: string | undefined;
  password?: string | undefined;
  options?: mongoose.ConnectOptions;
}

// MongoDB 插件
const mongoPlugin: FastifyPluginAsync<MongoOptions> = async (fastify, options) => {
  const { uri, user, password, options: mongoOptions = {} } = options;

  // 构建连接字符串
  let connectionString = uri;
  if (user && password) {
    const url = new URL(uri);
    url.username = user;
    url.password = password;
    connectionString = url.toString();
  }

  // 默认连接选项
  const defaultOptions: mongoose.ConnectOptions = {
    maxPoolSize: parseInt(process.env.DB_POOL_MAX || '10'),
    minPoolSize: parseInt(process.env.DB_POOL_MIN || '2'),
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    ...mongoOptions,
  };

  // 连接 MongoDB
  try {
    await mongoose.connect(connectionString, defaultOptions);

    // 监听连接事件
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB 已连接');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB 连接错误', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB 连接断开');
    });

    // 优雅关闭
    fastify.addHook('onClose', async () => {
      await mongoose.disconnect();
      logger.info('MongoDB 连接已关闭');
    });

    // 将 mongoose 实例添加到 fastify 实例
    fastify.decorate('mongoose', mongoose);
    fastify.decorate('mongo', mongoose.connection);

  } catch (error) {
    logger.error('MongoDB 连接失败', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      uri: connectionString.replace(/\/\/.*@/, '//***:***@'),
    });
    throw error;
  }
};

// 类型声明
declare module 'fastify' {
  interface FastifyInstance {
    mongoose: typeof mongoose;
    mongo: mongoose.Connection;
  }
}

export default mongoPlugin;
