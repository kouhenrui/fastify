import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import mongoose from "mongoose";
import { logger } from "../../config/logger/logger";
import { ErrorFactory } from "../../utils/errors/custom-errors";
import { initializeBaseData } from "../../model/mongo";

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
      connectTimeoutMS: 10000, // 增加连接超时时间
      ...op
    };
    // 直接连接 MongoDB
    await mongoose.connect(uri, defaultOptions);
    // 添加连接事件监听
    mongoose.connection.on("connecting", () => {
      logger.info("🔄 MongoDB 正在连接...");
    });

    mongoose.connection.on("connected", () => {
      logger.info("✅ MongoDB 连接已建立");
    });

    mongoose.connection.on("error", err => {
      logger.error("❌ MongoDB 连接错误", { error: err.message });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("⚠️ MongoDB 连接断开");
    });

    await initializeBaseData();
  } catch (error: any) {
    logger.error("MongoDB Mongoose 插件注册失败", {
      error: error.message
    });
    throw ErrorFactory.configuration(
      "MongoDB Mongoose 插件注册失败",
      error.message
    );
  }

  // 优雅关闭
  fastify.addHook("onClose", async () => {
    try {
      await mongoose.disconnect();
      logger.info("MongoDB Mongoose 连接已关闭");
    } catch (error: any) {
      logger.error("关闭 MongoDB Mongoose 连接失败", {
        error: error.message
      });
    }
  });
};

export default fp(mongoosePlugin, {
  name: "mongoose"
});
