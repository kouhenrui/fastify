import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import {
  PaginationHelper,
  ResponseHelper
} from "../../utils/response/response";
import fp from "fastify-plugin";
import { CustomError } from "../../utils/errors/custom-errors";
import { getClientIP } from "../../utils/cors/cors";
import { logger } from "../../config/logger/logger";
// 响应插件选项
interface ResponseOptions {
  enableRequestId?: boolean;
  enableTimestamp?: boolean;
  defaultSuccessMessage?: string;
  defaultErrorMessage?: string;
}

// 响应格式化插件
const responsePlugin: FastifyPluginAsync<ResponseOptions> = async (
  fastify,
  options
) => {
  const { enableRequestId = true } = options;

  // 生成请求 ID 的装饰器
  if (enableRequestId) {
    fastify.decorateRequest("requestId", "");

    fastify.addHook("onRequest", async (request: FastifyRequest) => {
      request.requestId = `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
    });
  }

  // 将响应工具添加到 fastify 实例
  fastify.decorate("response", ResponseHelper);
  fastify.decorate("pagination", PaginationHelper);

  // 扩展 FastifyReply 类型
  fastify.decorateReply("success", function <
    T
  >(this: FastifyReply, data: T, message?: string, code?: number) {
    // 使用 logger 打印返回数据
    logger.info("📤 API 响应", {
      url: this.request.url,
      method: this.request.method,
      statusCode: code || 200,
      message,
      data,
      requestId: (this.request as any).requestId
    });

    ResponseHelper.success(
      this,
      data,
      message,
      code,
      (this.request as any).requestId
    );
  });

  fastify.decorateReply("created", function <
    T
  >(this: FastifyReply, data: T, message?: string) {
    ResponseHelper.created(
      this,
      data,
      message,
      (this.request as any).requestId
    );
  });

  fastify.decorateReply(
    "noContent",
    function (this: FastifyReply, message?: string) {
      ResponseHelper.noContent(this, message, (this.request as any).requestId);
    }
  );

  fastify.decorateReply("list", function <
    T
  >(this: FastifyReply, items: T[], message?: string) {
    ResponseHelper.list(this, items, message, (this.request as any).requestId);
  });

  fastify.decorateReply("paginated", function <
    T
  >(this: FastifyReply, items: T[], total: number, page: number, limit: number, message?: string) {
    ResponseHelper.paginated(
      this,
      items,
      total,
      page,
      limit,
      message,
      (this.request as any).requestId
    );
  });

  fastify.decorateReply(
    "error",
    function (
      this: FastifyReply,
      message: string,
      error: string,
      code?: number,
      details?: any
    ) {
      // 使用 logger 打印错误响应
      logger.error("❌ API 错误响应", {
        url: this.request.url,
        method: this.request.method,
        statusCode: code || 500,
        message: message || "未知错误",
        error: error || "UNKNOWN_ERROR",
        details: details || null,
        requestId: (this.request as any).requestId,
        timestamp: new Date().toISOString()
      });

      ResponseHelper.error(
        this,
        message,
        error,
        code,
        details,
        (this.request as any).requestId
      );
    }
  );

  fastify.decorateReply(
    "validationError",
    function (this: FastifyReply, message?: string, details?: any) {
      // 使用 logger 打印验证错误
      logger.warn("⚠️ API 验证错误", {
        url: this.request.url,
        method: this.request.method,
        message,
        details,
        requestId: (this.request as any).requestId
      });

      ResponseHelper.validationError(
        this,
        message,
        details,
        (this.request as any).requestId
      );
    }
  );

  fastify.decorateReply(
    "unauthorized",
    function (this: FastifyReply, message?: string) {
      // 使用 logger 打印未授权错误
      logger.warn("🔒 API 未授权", {
        url: this.request.url,
        method: this.request.method,
        message,
        requestId: (this.request as any).requestId
      });

      ResponseHelper.unauthorized(
        this,
        message,
        (this.request as any).requestId
      );
    }
  );

  fastify.decorateReply(
    "forbidden",
    function (this: FastifyReply, message?: string) {
      // 使用 logger 打印禁止访问错误
      logger.warn("🚫 API 禁止访问", {
        url: this.request.url,
        method: this.request.method,
        message,
        requestId: (this.request as any).requestId
      });

      ResponseHelper.forbidden(this, message, (this.request as any).requestId);
    }
  );

  fastify.decorateReply(
    "notFound",
    function (this: FastifyReply, message?: string) {
      ResponseHelper.notFound(this, message, (this.request as any).requestId);
    }
  );

  fastify.decorateReply(
    "conflict",
    function (this: FastifyReply, message?: string) {
      ResponseHelper.conflict(this, message, (this.request as any).requestId);
    }
  );

  fastify.decorateReply(
    "internalError",
    function (
      this: FastifyReply,
      message?: string,
      error?: string,
      details?: any
    ) {
      ResponseHelper.internalError(
        this,
        message,
        error,
        details,
        (this.request as any).requestId
      );
    }
  );

  // 全局错误处理
  fastify.setErrorHandler(async (error, request, reply) => {
    const requestId = (request as any).requestId;
    fastify.logger.error("全局错误处理请求处理错误", {
      error: error.message,
      stack: error.stack,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      userAgent: request.headers["user-agent"] || "unknown",
      timestamp: new Date().toISOString(),
      ip: getClientIP(request),
      requestId
    });
    if (error instanceof CustomError) {
      return ResponseHelper.error(
        reply,
        error.message,
        error.code,
        error.statusCode,
        error.details,
        requestId
      );
    }
    if (error.statusCode === 400) {
      return ResponseHelper.validationError(reply, error.message, requestId);
    }

    // 未知错误
    return ResponseHelper.internalError(
      reply,
      process.env.NODE_ENV === "development" ? error.message : "服务器内部错误",
      "INTERNAL_SERVER_ERROR",
      process.env.NODE_ENV === "development"
        ? { stack: error.stack }
        : undefined,
      requestId
    );
  });

  // 404 处理
  fastify.setNotFoundHandler(async (request, reply) => {
    const requestId = (request as any).requestId;
    ResponseHelper.notFound(reply, "请求的资源不存在", requestId);
  });
};

// 类型声明
declare module "fastify" {
  interface FastifyInstance {
    response: typeof ResponseHelper;
    pagination: typeof PaginationHelper;
  }

  interface FastifyRequest {
    requestId?: string;
  }

  interface FastifyReply {
    success<T>(data: T, message?: string, code?: number): void;
    created<T>(data: T, message?: string): void;
    noContent(message?: string): void;
    list<T>(items: T[], message?: string): void;
    paginated<T>(
      items: T[],
      total: number,
      page: number,
      limit: number,
      message?: string
    ): void;
    error(message: string, error: string, code?: number, details?: any): void;
    validationError(message?: string, details?: any): void;
    unauthorized(message?: string): void;
    forbidden(message?: string): void;
    notFound(message?: string): void;
    conflict(message?: string): void;
    internalError(message?: string, error?: string, details?: any): void;
  }
}

export default fp(responsePlugin, {
  name: "response"
});
