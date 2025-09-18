import { FastifyInstance } from "fastify";
import v1Routes from "./v1";
import { KEY } from "../config/key";
import {
  errorResponseSchema,
  healthCheckSchema,
  systemInfoSchema
} from "../schemas";

export default async function router(fastify: FastifyInstance) {
  // 健康检查路由
  fastify.get("/health", {
    schema: {
      tags: ["系统"],
      summary: "健康检查",
      description: "检查服务运行状态和系统资源使用情况",
      response: {
        200: healthCheckSchema,
        500: errorResponseSchema
      }
    }
  }, async function (request, reply) {
    try {
      return reply.success(
        {
          status: "healthy",
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
  fastify.get("/", {
    schema: {
      tags: ["系统"],
      summary: "服务首页",
      description: "获取服务基本信息和功能特性",
        response: {
        200: {
          type: "object",
          properties: {
            code: { type: "number" },
            message: { type: "string" },
            data: {
              type: "object",
              properties: {
                message: { type: "string" },
                version: { type: "string" },
                environment: { type: "string" },
                databases: {
                  type: "object",
                  properties: {
                    mongodb: { type: "string" },
                    redis: { type: "string" },
                    postgres: { type: "string" }
                  }
                },
                features: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            },
            timestamp: { type: "number" },
            requestId: { type: "string" }
          }
        },
        500: errorResponseSchema
      }
    }
  }, async function (request, reply) {
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
  fastify.get("/api/info", {
    schema: {
      tags: ["系统"],
      summary: "获取 API 信息",
      description: "获取 API 的基本信息和技术栈",
      response: {
        200: systemInfoSchema,
        500: errorResponseSchema
      }
    }
  }, async function (request, reply) {
    return reply.success(
      {
        name: "Fastify API",
        version: KEY.apiVersion,
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

  // 注册 v1 版本路由
  await fastify.register(v1Routes, { prefix: KEY.apiVersion });
}
