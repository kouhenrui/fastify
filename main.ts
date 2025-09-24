import process from "process";
import { logger } from "./src/config/logger/logger";
import { createApp } from "./app";
import { KEY } from "./src/config/key";

// 启动服务器
async function start() {
  try {
    // 创建应用实例
    const fastify = await createApp();

    const port = KEY.port;
    fastify.listen({ port, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        logger.error("❌ 服务器启动失败", {
          error: err.message,
          stack: err.stack
        });
        process.exit(1);
      }
      logger.info("🎉 服务器启动成功", {
        address,
        bindTo: "0.0.0.0",
        environment: KEY.nodeEnv,
        nodeVersion: process.version,
        uptime: process.uptime()
      });
    });

    // 设置全局 fastify 实例引用，用于优雅关闭
    (global as any).fastify = fastify;
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
  const fastify = (global as any).fastify;
  if (fastify) {
    await fastify.close();
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("收到 SIGTERM 信号，正在关闭服务器...");
  const fastify = (global as any).fastify;
  if (fastify) {
    await fastify.close();
  }
  process.exit(0);
});
process.on("uncaughtException", (err: any) => {
  logger.error("❌ 未捕获的异常", {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});
process.on("unhandledRejection", (err: any) => {
  logger.error("❌ 未处理的拒绝", {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});
await start();
