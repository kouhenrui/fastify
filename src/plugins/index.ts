import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
// import jwt from "@fastify/jwt";
import rateLimit from '@fastify/rate-limit';
// import helmet from "@fastify/helmet";
import loggerPlugin from './logger/logger';
import responsePlugin from './response/response';
import mongoPlugin from './dataBase/mongodb';
import redisPlugin from './cache/redis';
import postgresPlugin from './dataBase/postgres';
import logger from '../config/logger';
import { getCorsConfigByEnv } from '../utils/cors/cors';
import { ErrorFactory } from '../utils/errors/custom-errors';

// 插件注册函数
async function registerPlugins(fastify: FastifyInstance) {
  // 第一步：强制注册日志和响应格式化插件，失败则启动失败
  try {
    await fastify.register(loggerPlugin, {
      enableRequestLogging: true,
      enableErrorLogging: true,
      logLevel: (process.env.LOG_LEVEL as any) || 'info'
    });

    await fastify.register(responsePlugin, {
      enableRequestId: true
    });
  } catch (error: any) {
    throw ErrorFactory.configuration(`日志系统不可用: ${error.message}`);
  }

  // 第二步：注册其他插件
  try {
    // 注册 CORS 插件 - 使用工具配置
    const corsConfig = getCorsConfigByEnv(process.env.NODE_ENV);
    await fastify.register(cors, corsConfig);

    // 注册 MongoDB 插件
    await fastify.register(mongoPlugin, {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fastify-app',
      user: process.env.MONGODB_USER || undefined,
      password: process.env.MONGODB_PASSWORD || undefined
    });

    // 注册 Redis 插件
    await fastify.register(redisPlugin, {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0'),
      password: process.env.REDIS_PASSWORD || undefined
    });

    // 注册 Swagger 插件
    await fastify.register(fastifySwagger, {
      swagger: {
        info: {
          title: 'Fastify Swagger',
          version: '1.0.0',
          description: 'Fastify API 文档'
        },
        host: 'localhost:3000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json']
      }
    });

    // 注册限流插件
    await fastify.register(rateLimit, {
      redis: fastify.redis,
      max: 100, // 每分钟最多 100 个请求
      timeWindow: '1 minute',
      errorResponseBuilder(request, context) {
        return {
          code: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded, retry in ${Math.round(Number(context.after) / 1000)} seconds`,
          retryAfter: Math.round(Number(context.after) / 1000)
        };
      }
    });

    // 注册 Swagger UI 插件
    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
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
      transformStaticCSP: (header) => {
        // 允许连接到本地服务器
        return header.replace(
          'default-src \'self\'',
          'default-src \'self\' \'unsafe-inline\' \'unsafe-eval\' data: blob: http://localhost:* https://localhost:*'
        );
      },
      transformSpecificationClone: true
    });

    // 注册 PostgreSQL 插件（可选）
    if (process.env.ENABLE_POSTGRES === 'true') {
      await fastify.register(postgresPlugin, {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE || 'fastify_app',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'password',
        ssl: process.env.POSTGRES_SSL === 'true'
      });
    }
    logger.info('已挂载的插件:', {
      plugins: [
        'logger',
        'cors',
        'swagger',
        'response',
        'mongodb',
        'redis',
        ...(process.env.ENABLE_POSTGRES === 'true' ? ['postgresql'] : [])
      ]
    });
  } catch (error: any) {
    // 使用已注册的日志系统记录错误
    logger.error('插件注册失败', {
      error: error.message
    });
    throw ErrorFactory.configuration('插件注册失败');
  }
}

export default registerPlugins;
