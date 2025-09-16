import { FastifyPluginAsync } from "fastify";
import { logger } from "../../config/logger.js";
import fp from "fastify-plugin";
// 日志插件选项
interface LoggerOptions {
  enableRequestLogging?: boolean;
  enableErrorLogging?: boolean;
  logLevel?: "error" | "warn" | "info" | "http" | "debug";
}

// 日志插件
const loggerPlugin: FastifyPluginAsync<LoggerOptions> = async (
  fastify,
  options
) => {
  const {
    enableRequestLogging = true,
    enableErrorLogging = true,
    logLevel = "info",
  } = options;

  // 设置日志级别
  logger.level = logLevel;

  // 将日志器添加到 fastify 实例
  // 使用更可靠的方式注册装饰器

  fastify.decorate("logger", logger);

  // 验证装饰器是否成功添加
  if (!fastify.logger) {
    throw new Error("日志装饰器添加失败：fastify.logger 未定义");
  }

  // 请求日志中间件
  if (enableRequestLogging) {
    fastify.addHook("onRequest", async (request, reply) => {
      const start = Date.now();
      request.startTime = start;
    });

    fastify.addHook("onResponse", async (request, reply) => {
      const duration = Date.now() - (request.startTime || Date.now());
      const logData = {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        userAgent: request.headers["user-agent"],
        ip: request.ip,
        timestamp: new Date().toISOString(),
      };

      if (reply.statusCode >= 400) {
        logger.warn("HTTP Request", logData);
      } else {
        logger.http("HTTP Request", logData);
      }
    });
  }

  // 错误处理中间件
  if (enableErrorLogging) {
    fastify.setErrorHandler(async (error, request, reply) => {
      logger.error("日志插件请求处理错误", {
        error: error.message,
        stack: error.stack,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        timestamp: new Date().toISOString(),
      });
      reply.status(500).send({
        error: "Internal Server Error",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    });
  }

  // 应用关闭日志
  fastify.addHook("onClose", async () => {
    logger.info("Fastify 应用正在关闭");
  });
};

// 类型声明
declare module "fastify" {
  interface FastifyInstance {
    logger: typeof logger;
  }

  interface FastifyRequest {
    startTime?: number;
  }
}

export default fp(loggerPlugin, {
  name: "logger",
});
