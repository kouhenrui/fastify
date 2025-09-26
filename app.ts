import "reflect-metadata";
import Fastify, { FastifyInstance } from "fastify";
import dotenv from "dotenv";
import { logger } from "./src/config/logger/logger";
import registerPlugins from "./src/plugins/index";
import { setDefaultLanguage } from "./src/utils/i18n";
import { registerMiddleware } from "./src/middleware";
import { initializeORMManager } from "./src/config/casbin/ormManager";
import redisService from "./src/utils/redis";
import router from "./src/route/router";
// 加载环境变量
dotenv.config();

/**
 * 创建 Fastify 应用实例
 * @returns 配置好的 Fastify 实例
 */
export async function createApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false
  });

  try {
    // 注册插件（日志系统必须成功）
    await registerPlugins(fastify);
    logger.info("✅ 插件注册完成");

    // 注册中间件
    await registerMiddleware(fastify);
    logger.info("✅ 中间件注册完成");
    // 初始化 i18n 翻译系统
    setDefaultLanguage();
    logger.info("✅ i18n 翻译系统初始化完成");
    // 初始化 ORMManager
    await initializeORMManager();

    // 初始化 Redis
    await redisService.initializeRedis();
    logger.info("✅ Redis 初始化完成");

    // 注册路由
    router(fastify);
    logger.info("✅ 路由注册完成");

    return fastify;
  } catch (error) {
    logger.error("❌ 应用初始化失败", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * 获取默认的 Fastify 实例
 * @returns 配置好的 Fastify 实例
 */
export async function getApp(): Promise<FastifyInstance> {
  return await createApp();
}
