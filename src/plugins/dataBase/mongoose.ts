import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { MongoModel } from "../../model/mongo";
import { logger } from "../../config/logger/logger";
import mongoose, { Connection } from "mongoose";
import { ErrorFactory } from "../../utils/errors/custom-errors";

// Mongoose 插件选项
interface MongooseOptions {
  uri: string;
  options?: {
    user?: string;
    pass?: string;
  };
}

// Mongoose 插件
const mongoosePlugin: FastifyPluginAsync<MongooseOptions> = async (
  fastify,
  options
) => {
  const { uri, options: op = {} } = options;

  try {
    const defaultOptions: mongoose.ConnectOptions = {
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ...op
    };
    const connection = await MongoModel.init(uri, defaultOptions);
    if (!connection) throw ErrorFactory.configuration("MongoDB 连接初始化失败");
    // 将连接添加到 fastify 实例
    fastify.decorate("mongoose", connection);

    // 添加 MongoDB 工具方法
    fastify.decorate("mongoUtils", {
      /**
       * 获取集合
       * @param name 集合名称
       * @returns 集合实例
       */
      getCollection: (name: string) => {
        return connection.collection(name);
      },

      /**
       * 执行原生查询
       * @param operation 操作函数
       * @returns 查询结果
       */
      executeQuery: async (operation: (db: any) => Promise<any>) => {
        return await operation(connection.db);
      },

      /**
       * 创建索引
       * @param collection 集合名称
       * @param indexSpec 索引规范
       * @param options 索引选项
       */
      createIndex: async (
        collection: string,
        indexSpec: any,
        options?: any
      ) => {
        return await connection
          .collection(collection)
          .createIndex(indexSpec, options);
      }
    });
  } catch (error: any) {
    logger.error("MongoDB Mongoose 插件注册失败", {
      error: error.message
    });
    throw error;
  }

  // 优雅关闭
  fastify.addHook("onClose", async () => {
    try {
      await MongoModel.close();
      logger.info("MongoDB Mongoose 连接已关闭");
    } catch (error: any) {
      logger.error("关闭 MongoDB Mongoose 连接失败", {
        error: error.message
      });
    }
  });
};

// 类型声明
declare module "fastify" {
  interface FastifyInstance {
    mongoose: Connection;
    mongoUtils: {
      getCollection: (name: string) => any;
      executeQuery: (operation: (db: any) => Promise<any>) => Promise<any>;
      createIndex: (
        collection: string,
        indexSpec: any,
        options?: any
      ) => Promise<any>;
    };
  }
}

export default fp(mongoosePlugin, {
  name: "mongoose"
});
