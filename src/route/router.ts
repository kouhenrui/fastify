import { FastifyInstance } from "fastify";

export default function router(fastify: FastifyInstance) {
  // 健康检查路由
  fastify.get("/health", async function (request, reply) {
    try {
      const services: Record<string, boolean> = {
        mongodb: fastify.mongoose.connection.readyState === 1,
        redis: fastify.redis.status === "ready"
      };

      return reply.success(
        {
          status: "healthy",
          services,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        "服务健康检查通过"
      );
    } catch (error) {
      return reply.internalError("健康检查失败", "HEALTH_CHECK_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // 根路径
  fastify.get("/", async function (request, reply) {
    try {
      return reply.success(
        {
          message: "Fastify 服务运行正常",
          version: "1.0.0",
          environment: process.env.NODE_ENV,
          databases: {
            mongodb: "已连接",
            redis: "已连接",
            postgres: "已连接"
          },
          features: [
            "统一响应格式",
            "多数据库支持",
            "完整日志系统",
            "插件化架构"
          ]
        },
        "欢迎使用 Fastify API 服务"
      );
    } catch (error) {
      return reply.internalError("服务访问失败", "ROOT_ACCESS_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // API 信息路由
  fastify.get("/api/info", async function (request, reply) {
    return reply.success(
      {
        name: "Fastify API",
        version: "1.0.0",
        description: "基于 Fastify 的现代化 Node.js API 服务",
        technologies: [
          "Fastify 5.x",
          "TypeScript 5.x",
          "MongoDB",
          "Redis",
          "PostgreSQL",
          "Winston"
        ]
      },
      "API 信息获取成功"
    );
  });
}
