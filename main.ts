import "reflect-metadata";
import Fastify from "fastify";
import process from "process";
import dotenv from "dotenv";
import { logger } from "./src/config/logger/logger";
import registerPlugins from "./src/plugins/index";
import router from "./src/route/router";

// 加载环境变量
dotenv.config();

const fastify = Fastify({
  logger: false
});

// 启动服务器
async function start() {
  try {
    // 注册插件（日志系统必须成功）
    await registerPlugins(fastify);
    // 注册路由
    router(fastify);

    const port = parseInt(process.env.PORT || "3000");
    fastify.listen({ port, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        logger.error("❌ 服务器启动失败", {
          error: err.message,
          stack: err.stack
        });
      }
      logger.info("🎉 服务器启动成功", {
        address,
        bindTo: "0.0.0.0",
        environment: process.env.NODE_ENV,
        nodeVersion: process.version,
        uptime: process.uptime()
      });
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    logger.error("❌ 服务器启动失败", {
      error: errorMessage,
      stack: err instanceof Error ? err.stack : undefined
    });
    process.exit(1);
  }
}

// 优雅关闭
process.on("SIGINT", async () => {
  logger.info("收到 SIGINT 信号，正在关闭服务器...");
  await fastify.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("收到 SIGTERM 信号，正在关闭服务器...");
  await fastify.close();
  process.exit(0);
});

start();
