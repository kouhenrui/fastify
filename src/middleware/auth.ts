import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { KEY } from "../config/key";

// 扩展请求类型，添加用户信息
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      username: string;
      email?: string;
      roles?: string[];
      [key: string]: any;
    };
  }
}

async function authMiddleware(fastify: FastifyInstance) {
  // 认证中间件
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // 定义不需要认证的公开路由
      const publicRoutes = [
        "/v1/auth/login",
        "/v1/auth/register",
        "/health",
        "/docs",
        "/swagger"
      ];

      // 检查是否为公开路由
      const isPublicRoute = publicRoutes.some(route =>
        request.url.startsWith(route)
      );

      if (isPublicRoute) {
        return; // 跳过认证
      }

      // 获取 Authorization 头
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "缺少认证令牌"
        });
        return;
      }

      // 检查 Bearer token 格式
      if (!authHeader.startsWith("Bearer ")) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "认证令牌格式错误，应为 Bearer <token>"
        });
        return;
      }

      // 提取 token
      const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

      if (!token) {
        reply.code(401).send({
          error: "Unauthorized",
          message: "认证令牌为空"
        });
        return;
      }

      try {
        // 验证并解析 token
        const decoded = jwt.verify(token, KEY.secretKey) as any;

        // 检查 token 是否包含必要信息
        if (!decoded.id || !decoded.username) {
          reply.code(401).send({
            error: "Unauthorized",
            message: "Token 信息不完整"
          });
          return;
        }

        // 将用户信息附加到请求对象
        request.user = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          roles: decoded.roles || [],
          ...decoded // 包含其他可能的用户信息
        };
      } catch (error: any) {
        let message = "Token 验证失败";

        if (error.name === "TokenExpiredError") {
          message = "Token 已过期";
        } else if (error.name === "JsonWebTokenError") {
          message = "Token 格式错误";
        } else if (error.name === "NotBeforeError") {
          message = "Token 尚未生效";
        }

        reply.code(401).send({
          error: "Unauthorized",
          message
        });
        return;
      }
    }
  );
}

export default fp(authMiddleware, {
  name: "auth-middleware"
});
