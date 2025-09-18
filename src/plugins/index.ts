import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import mongoosePlugin from "./dataBase/mongoose";
import loggerPlugin from "./logger/logger";
import responsePlugin from "./response/response";
import redisPlugin from "./cache/redis";
// import prismaPlugin from "./dataBase/prisma";
// import typeormPlugin from "./dataBase/typeorm";
// import mongoosePlugin from "./dataBase/mongoose";
import logger from "../config/logger/logger";
import { getCorsConfigByEnv } from "../utils/cors/cors";
import { ErrorFactory } from "../utils/errors/custom-errors";
import { KEY } from "../config/key";

// 插件注册函数
async function registerPlugins(fastify: FastifyInstance) {
  // 第一步：强制注册日志和响应格式化插件，失败则启动失败
  try {
    // 注册日志插件
    await fastify.register(loggerPlugin, {
      logLevel: KEY.logLevel as "info" | "error" | "warn" | "debug"
    });

    // 注册响应格式化插件
    await fastify.register(responsePlugin, { enableRequestId: true });
  } catch (error: any) {
    throw ErrorFactory.configuration(`日志系统不可用: ${error.message}`);
  }

  // 第二步：注册其他插件
  try {
    // 注册 CORS 插件 - 使用工具配置
    const corsConfig = getCorsConfigByEnv(KEY.nodeEnv);
    await fastify.register(cors, corsConfig);

    // 注册 JWT 插件
    await fastify.register(jwt, {
      secret: KEY.secretKey
    });

    // 注册 Redis 插件
    await fastify.register(redisPlugin, {
      host: KEY.redisHost,
      port: KEY.redisPort,
      db: KEY.redisDb,
      password: KEY.redisPassword
    });

    // 注册 Swagger 插件
    await fastify.register(fastifySwagger, {
      swagger: {
        info: {
          title: "Fastify API 文档",
          version: KEY.apiVersion,
          description:
            "基于 Fastify 的现代化 Node.js API 服务，支持多数据库、Redis 缓存、JWT 认证等功能",
          contact: {
            name: "API 支持",
            email: "support@example.com"
          },
          license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT"
          }
        },
        host: "localhost:3000",
        schemes: ["http", "https"],
        consumes: ["application/json"],
        produces: ["application/json"],
        tags: [
          {
            name: "认证",
            description: "用户认证相关接口"
          },
          {
            name: "系统",
            description: "系统信息和健康检查"
          }
        ],
        securityDefinitions: {
          bearerAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description: "JWT Bearer Token 认证"
          }
        },
        security: [
          {
            bearerAuth: []
          }
        ]
      }
    });
    // 注册 Swagger UI 插件
    await fastify.register(fastifySwaggerUi, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "full",
        deepLinking: false
      },
      uiHooks: {
        onRequest(_request, _reply, next) {
          next();
        },
        preHandler(_request, _reply, next) {
          next();
        }
      },
      staticCSP: false, // 禁用严格的 CSP
      transformStaticCSP: header => {
        // 允许连接到本地服务器
        return header.replace(
          "default-src 'self'",
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* https://localhost:*"
        );
      },
      transformSpecificationClone: true
    });
    // 注册限流插件
    await fastify.register(rateLimit, {
      redis: fastify.redis,
      max: 100, // 每分钟最多 100 个请求
      timeWindow: "1 minute",
      errorResponseBuilder(request, context) {
        return {
          code: 429,
          error: "Too Many Requests",
          message: `Rate limit exceeded, retry in ${Math.round(Number(context.after) / 1000)} seconds`,
          retryAfter: Math.round(Number(context.after) / 1000)
        };
      }
    });

    // 注册 Helmet 插件
    await fastify.register(helmet, {
      contentSecurityPolicy: false
    });

    // 注册 Mongoose 插件
    await fastify.register(mongoosePlugin, {
      uri: KEY.mongodbUri
    });

    // 注册 TypeORM 插件
    // await fastify.register(typeormPlugin,{autoInitialize: true});

    // 注册 Prisma的pg 插件
    // await fastify.register(prismaPlugin, {autoInitialize: true});

    // 注册 Mongoose 插件
    // await fastify.register(mongoosePlugin, {
    //   uri: KEY.mongodbUri
    // });
    // 日志输出已挂载的插件
    logger.info("已挂载的插件:", {
      plugins: [
        "logger",
        "cors",
        "swagger",
        "response",
        "typeorm",
        "prismaPg",
        "mongoose",
        "redis"
      ]
    });
  } catch (error: any) {
    // 使用已注册的日志系统记录错误
    logger.error("插件注册失败", {
      error: error.message
    });
    throw ErrorFactory.configuration("插件注册失败");
  }
}

export default registerPlugins;
