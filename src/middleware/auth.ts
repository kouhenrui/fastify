import fp from "fastify-plugin";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { KEY } from "../config/key";
import { ErrorFactory } from "../utils/errors/custom-errors";
import t, { Language } from "../utils/i18n";
import logger from "../config/logger/logger";


async function authMiddleware(fastify: FastifyInstance) {
  // 认证中间件
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      // 定义不需要认证的公开路由
      const publicRoutes = [
        "/v1/auth/login",
        "/v1/auth/register",
        "/health",
        "/docs"
      ];

      // 检查是否为公开路由
      const isPublicRoute = publicRoutes.some(route =>
        request.url.startsWith(route)
      );

      if (isPublicRoute) {
        return; // 跳过认证
      }
      const lang = (request.headers["accept-language"] ||
        KEY.language) as Language;
      request.lang = lang;
      // 获取 Authorization 头
      const authHeader = request.headers.authorization;
      logger.info(`request`, { lang: request.lang });
      if (!authHeader) {
        throw ErrorFactory.authentication(
          t("auth.missing_auth_token", undefined, lang),
          "MISSING_AUTH_TOKEN"
        );
      }

      // 检查 Bearer token 格式
      if (!authHeader.startsWith("Bearer ")) {
        throw ErrorFactory.authentication(
          t("auth.invalid_auth_token_format", undefined, lang),
          "INVALID_AUTH_TOKEN_FORMAT"
        );
        return;
      }

      // 提取 token
      const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

      if (!token) {
        throw ErrorFactory.authentication(
          t("auth.empty_auth_token", undefined, lang),
          "EMPTY_AUTH_TOKEN"
        );
        return;
      }

      try {
        // 验证并解析 token
        const decoded = jwt.verify(token, KEY.secretKey) as any;

        // 检查 token 是否包含必要信息
        if (!decoded.id || !decoded.username) {
          throw ErrorFactory.authentication(
            t("auth.token_info_incomplete", undefined, lang),
            "TOKEN_INFO_INCOMPLETE"
          );
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
        let message = "";

        if (error.name === "TokenExpiredError") {
          message = t("auth.token_expired", undefined, lang);
        } else if (error.name === "JsonWebTokenError") {
          message = t("auth.token_format_error", undefined, lang);
        } else if (error.name === "NotBeforeError") {
          message = t("auth.token_not_active", undefined, lang);
        } else {
          message = t("auth.token_verification_failed", undefined, lang);
        }

        throw ErrorFactory.authentication(message, "TOKEN_VERIFICATION_FAILED");
      }
    }
  );
}

export default fp(authMiddleware, {
  name: "auth-middleware"
});
