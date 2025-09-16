import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
// import jwt from "@fastify/jwt";
// import rateLimit from "@fastify/rate-limit";
// import helmet from "@fastify/helmet";
import loggerPlugin from "./logger/logger";
import responsePlugin from "./response/response";
import mongoPlugin from "./dataBase/mongodb";
import redisPlugin from "./cache/redis";
import postgresPlugin from "./dataBase/postgres";
import logger from "../config/logger";

// 插件注册函数
async function registerPlugins(fastify: FastifyInstance) {
  // 第一步：强制注册日志插件，失败则启动失败
  try {
    await fastify.register(loggerPlugin, {
      enableRequestLogging: true,
      enableErrorLogging: true,
      logLevel: (process.env.LOG_LEVEL as any) || "info",
    });
  } catch (error) {
    console.error("使用日志系统时出错:", error);
    throw new Error("日志系统不可用");
  }

  // 第二步：注册其他插件
  try {
    // 注册 CORS 插件
   await fastify.register(cors, {
      origin: "*",
    });
    
    // 注册 Swagger 插件
    await fastify.register(fastifySwagger, {
      swagger: {
        info: { 
          title: "Fastify Swagger", 
          version: "1.0.0",
          description: "Fastify API 文档"
        },
        host: "localhost:3000",
        schemes: ["http"],
        consumes: ["application/json"],
        produces: ["application/json"],
      },
    });
    
    // 注册 Swagger UI 插件
    await fastify.register(fastifySwaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "full",
        deepLinking: false
      },
      uiHooks: {
        onRequest: function (request, reply, next) { next() },
        preHandler: function (request, reply, next) { next() }
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
      transformSpecificationClone: true
    });
    // 注册响应格式化插件
    await fastify.register(responsePlugin, {
      enableRequestId: true,
      enableTimestamp: true,
      defaultSuccessMessage: "操作成功",
      defaultErrorMessage: "操作失败",
    });

    // 注册 MongoDB 插件
    await fastify.register(mongoPlugin, {
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/fastify-app",
      user: process.env.MONGODB_USER || undefined,
      password: process.env.MONGODB_PASSWORD || undefined,
    });

    // 注册 Redis 插件
    await fastify.register(redisPlugin, {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      db: parseInt(process.env.REDIS_DB || "0"),
      password: process.env.REDIS_PASSWORD || undefined,
    });

    // 注册 PostgreSQL 插件（可选）
    if (process.env.ENABLE_POSTGRES === "true") {
      await fastify.register(postgresPlugin, {
        host: process.env.POSTGRES_HOST || "localhost",
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        database: process.env.POSTGRES_DATABASE || "fastify_app",
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "password",
        ssl: process.env.POSTGRES_SSL === "true",
      });
    }
    logger.info("已挂载的插件:", {
      plugins: [
        "logger",
        "cors",
        "swagger",
        "swagger-ui",
        "response",
        "mongodb",
        "redis",
        ...(process.env.ENABLE_POSTGRES === "true" ? ["postgresql"] : []),
      ],
    });
  } catch (error) {
    // 使用已注册的日志系统记录错误
    logger.error("插件注册失败", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export default registerPlugins;
