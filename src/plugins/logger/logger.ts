import { FastifyPluginAsync } from "fastify";
import { logger } from "../../config/logger/logger.js";
import fp from "fastify-plugin";
import { Language } from "../../utils/i18n/index.js";
// 日志插件选项
interface LoggerOptions {
  enableErrorLogging?: boolean;
  logLevel?: "error" | "warn" | "info" | "http" | "debug";
}

// 日志插件
const loggerPlugin: FastifyPluginAsync<LoggerOptions> = async (
  fastify,
  options
) => {
  const { logLevel = "info" } = options;

  // 设置日志级别
  logger.level = logLevel;

  // 将日志器添加到 fastify 实例
  // 使用更可靠的方式注册装饰器

  fastify.decorate("logger", logger);

  // 验证装饰器是否成功添加
  if (!fastify.logger) {
    throw new Error("日志装饰器添加失败：fastify.logger 未定义");
  }

  fastify.addHook("onRequest", async (request, _reply) => {
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
      requestId: request.requestId
    };

    if (reply.statusCode >= 400) {
      logger.warn("HTTP Request", logData);
    } else {
      logger.info("HTTP Request", logData);
    }
  });

  // 应用关闭日志
  fastify.addHook("onClose", async () => {
    logger.info("Fastify 应用正在关闭");
  });
};

// 类型声明 扩展请求类型，添加用户信息
declare module "fastify" {
  interface FastifyInstance {
    logger: typeof logger;
  }

  interface FastifyRequest {
    startTime?: number;
    Body?: Record<string, any>;
    Params?: Record<string, any>;
    Query?: Record<string, any>;
    Headers?: Record<string, any>;
    Cookies?: Record<string, any>;
    lang?: Language;
    user: {
      id: string;
      username: string;
      roles: string[];
      [key: string]: any;
    };
    requestId?: string;
  }

  interface FastifyReply {
    success<T>(data: T, message?: string, code?: number): void;
    created<T>(data: T, message?: string): void;
    noContent(message?: string): void;
  }
}

export default fp(loggerPlugin, {
  name: "logger"
});
