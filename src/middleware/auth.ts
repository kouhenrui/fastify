import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { KEY } from "../config/key";
import { ErrorFactory } from "../utils/errors/custom-errors";
import t, { handleRequestLanguage } from "../utils/i18n";

async function authMiddleware(fastify: FastifyInstance) {
  // 认证中间件
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      // 从配置获取不需要认证的公开路由
      const publicRoutes = KEY.publicRoutes
        .split(",")
        .map(route => route.trim());

      // 检查是否为公开路由
      const isPublicRoute = publicRoutes.some(route =>
        request.url.startsWith(route)
      );

      if (isPublicRoute) return; // 跳过认证

      const lang = handleRequestLanguage(request);
      request.lang = lang;
      // 获取 Authorization 头
      const authHeader = request.headers.authorization;
      if (!authHeader) throw ErrorFactory.authentication("MISSING_AUTH_TOKEN");

      // 检查 Bearer token 格式
      if (!authHeader.startsWith("Bearer "))
        throw ErrorFactory.authentication("INVALID_AUTH_TOKEN_FORMAT");

      // 提取 token
      const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

      if (!token) throw ErrorFactory.authentication("EMPTY_AUTH_TOKEN");

      try {
        // 验证并解析 token
        const decoded = jwt.verify(token, KEY.secretKey) as any;

        // 检查 token 是否包含必要信息
        if (!decoded.id || !decoded.username)
          throw ErrorFactory.authentication("TOKEN_INFO_INCOMPLETE");

        // 将用户信息附加到请求对象
        request.user = {
          id: decoded.id,
          username: decoded.username,
          roles: decoded.roles || [],
          ...decoded // 包含其他可能的用户信息
        };
      } catch (error: any) {
        throw ErrorFactory.authentication(
          t("auth.token_verification_failed", undefined, lang),
          error.message
        );
      }
    }
  );
}

export default fp(authMiddleware, {
  name: "auth-middleware"
});
