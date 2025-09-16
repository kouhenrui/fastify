import { FastifyInstance } from "fastify";
import { ErrorFactory } from "../utils/errors/custom-errors";

export default function router(fastify: FastifyInstance) {
  // 健康检查路由
  fastify.get("/health", async function (request, reply) {
    try {
      const services: Record<string, boolean> = {
        mongodb: fastify.mongoose.connection.readyState === 1,
        redis: fastify.redis.status === "ready",
      };

      const allHealthy = Object.values(services).every(
        (status) => status === true
      );
      return reply.success(
        {
          status: "healthy",
          services,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        "服务健康检查通过"
      );
    } catch (error) {
      return reply.internalError("健康检查失败", "HEALTH_CHECK_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // 根路径
  fastify.get("/", async function (request, reply) {
    try {
      // 测试 Redis 连接
      await fastify.cache.set("test", "test", 60);
      const data = await fastify.cache.get("test");
      console.log("Redis 测试数据:", data);

      return reply.success(
        {
          message: "Fastify 服务运行正常",
          version: "1.0.0",
          environment: process.env.NODE_ENV,
          databases: {
            mongodb: "已连接",
            redis: "已连接",
            postgres: "已连接",
          },
          features: [
            "统一响应格式",
            "多数据库支持",
            "完整日志系统",
            "插件化架构",
          ],
          redisTest: data, // 添加 Redis 测试结果
        },
        "欢迎使用 Fastify API 服务"
      );
    } catch (error) {
      return reply.internalError("服务访问失败", "ROOT_ACCESS_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // API 信息路由
  fastify.get("/api/info", async function (request, reply) {
    try {
        throw ErrorFactory.business("测试错误");
      // 测试 Redis 连接
      await fastify.cache.set("test", "test", 60);
      const data = await fastify.cache.get("test");

      return reply.success(
        {
          name: "Fastify API",
          version: "1.0.0",
          description: "基于 Fastify 的现代化 Node.js API 服务",
          endpoints: {
            health: "GET /health - 健康检查",
            info: "GET /api/info - API 信息",
            root: "GET / - 根路径",
          },
          technologies: [
            "Fastify 5.x",
            "TypeScript 5.x",
            "MongoDB",
            "Redis",
            "PostgreSQL",
            "Winston",
          ],
          redisTest: data, // 添加 Redis 测试结果
        },
        "API 信息获取成功"
      );
    } catch (error) {
      throw error;
      //   return reply.internalError("获取 API 信息失败", "API_INFO_ERROR", {
      //     error: error instanceof Error ? error.message : "Unknown error",
      //   });
    }
  });
}
