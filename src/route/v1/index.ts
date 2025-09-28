import { FastifyInstance } from "fastify";
import authRoutes from "../auth";
import userProfileRoutes from "../userProfile";
import { KEY } from "../../config/key";

const v1Routes = async (fastify: FastifyInstance) => {
  await fastify.register(authRoutes, { prefix: "auth" });
  await fastify.register(userProfileRoutes, { prefix: "user-profile" });
  fastify.get(
    "",
    {
      schema: {
        tags: ["系统"],
        summary: "获取 API v1 版本信息",
        description: "获取当前 API 版本的基本信息和技术栈"
      }
    },
    async (request, reply) => {
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
        "API v1版本 信息获取成功"
      );
    }
  );
};

export default v1Routes;
