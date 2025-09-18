import { FastifyReply } from "fastify";
import {
  ErrorResponse,
  HttpStatus,
  ListResponse,
  PaginatedResponse,
  PaginationParams,
  PaginationQuery,
  SuccessResponse
} from "../types/response";

// 生成请求 ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// 成功响应工具函数
export class ResponseHelper {
  // 基础成功响应
  static success<T>(
    reply: FastifyReply,
    data: T,
    message: string = "操作成功",
    code: number = HttpStatus.OK,
    requestId?: string
  ): void {
    const response: SuccessResponse<T> = {
      code,
      message,
      data,
      timestamp: new Date().getTime(),
      requestId: requestId || generateRequestId()
    };

    reply.code(code).send(response);
  }

  // 创建成功响应
  static created<T>(
    reply: FastifyReply,
    data: T,
    message: string = "创建成功",
    requestId?: string
  ): void {
    this.success(reply, data, message, HttpStatus.CREATED, requestId);
  }

  // 无内容响应
  static noContent(
    reply: FastifyReply,
    message: string = "操作成功",
    requestId?: string
  ): void {
    const response: SuccessResponse<null> = {
      code: HttpStatus.NO_CONTENT,
      message,
      data: null,
      timestamp: new Date().getTime(),
      requestId: requestId || generateRequestId()
    };

    reply.code(HttpStatus.NO_CONTENT).send(response);
  }

  // 列表响应
  static list<T>(
    reply: FastifyReply,
    items: T[],
    message: string = "获取列表成功",
    requestId?: string
  ): void {
    const response: ListResponse<T> = {
      code: HttpStatus.OK,
      message,
      data: {
        items,
        count: items.length
      },
      timestamp: new Date().getTime(),
      requestId: requestId || generateRequestId()
    };

    reply.code(HttpStatus.OK).send(response);
  }

  // 分页响应
  static paginated<T>(
    reply: FastifyReply,
    items: T[],
    total: number,
    page: number,
    limit: number,
    message: string = "获取分页数据成功",
    requestId?: string
  ): void {
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<T> = {
      code: HttpStatus.OK,
      message,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      },
      timestamp: new Date().getTime(),
      requestId: requestId || generateRequestId()
    };

    reply.code(HttpStatus.OK).send(response);
  }

  // 错误响应
  static error(
    reply: FastifyReply,
    message: string,
    error: string,
    code: number = HttpStatus.INTERNAL_SERVER_ERROR,
    details?: any,
    requestId?: string
  ): void {
    const response: ErrorResponse = {
      code,
      message,
      error,
      details,
      timestamp: new Date().getTime(),
      requestId: requestId || generateRequestId()
    };

    reply.code(HttpStatus.OK).send(response);
  }

  // 验证错误响应
  static validationError(
    reply: FastifyReply,
    message: string = "请求参数验证失败",
    details?: any,
    requestId?: string
  ): void {
    this.error(
      reply,
      message,
      "VALIDATION_ERROR",
      HttpStatus.BAD_REQUEST,
      details,
      requestId
    );
  }

  // 未授权错误响应
  static unauthorized(
    reply: FastifyReply,
    message: string = "未授权访问",
    requestId?: string
  ): void {
    this.error(
      reply,
      message,
      "UNAUTHORIZED",
      HttpStatus.UNAUTHORIZED,
      undefined,
      requestId
    );
  }

  // 禁止访问错误响应
  static forbidden(
    reply: FastifyReply,
    message: string = "禁止访问",
    requestId?: string
  ): void {
    this.error(
      reply,
      message,
      "FORBIDDEN",
      HttpStatus.FORBIDDEN,
      undefined,
      requestId
    );
  }

  // 资源未找到错误响应
  static notFound(
    reply: FastifyReply,
    message: string = "资源未找到",
    requestId?: string
  ): void {
    this.error(
      reply,
      message,
      "NOT_FOUND",
      HttpStatus.NOT_FOUND,
      undefined,
      requestId
    );
  }

  // 冲突错误响应
  static conflict(
    reply: FastifyReply,
    message: string = "资源冲突",
    requestId?: string
  ): void {
    this.error(
      reply,
      message,
      "CONFLICT",
      HttpStatus.CONFLICT,
      undefined,
      requestId
    );
  }

  // 服务器内部错误响应
  static internalError(
    reply: FastifyReply,
    message: string = "服务器内部错误",
    error?: string,
    details?: any,
    requestId?: string
  ): void {
    this.error(
      reply,
      message,
      error || "INTERNAL_SERVER_ERROR",
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
      requestId
    );
  }
}

// 分页参数解析工具
export class PaginationHelper {
  // 解析分页参数
  static parseParams(params: PaginationParams): PaginationQuery {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const offset = (page - 1) * limit;
    const sort = params.sort || "createdAt";
    const order = params.order || "desc";

    return {
      page,
      limit,
      offset,
      sort,
      order
    };
  }

  // 验证分页参数
  static validateParams(params: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.page !== undefined) {
      const page = Number(params.page);
      if (isNaN(page) || page < 1) {
        errors.push("页码必须是大于0的整数");
      }
    }

    if (params.limit !== undefined) {
      const limit = Number(params.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push("每页数量必须是1-100之间的整数");
      }
    }

    if (params.order !== undefined && !["asc", "desc"].includes(params.order)) {
      errors.push("排序方向必须是asc或desc");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 响应装饰器工具
export function withResponse<T>(
  handler: (request: any, reply: FastifyReply) => Promise<T>
) {
  return async (request: any, reply: FastifyReply) => {
    try {
      const result = await handler(request, reply);

      // 如果已经发送了响应，直接返回
      if (reply.sent) {
        return;
      }

      // 根据结果类型自动选择响应格式
      if (result === null || result === undefined) {
        ResponseHelper.noContent(reply);
      } else if (Array.isArray(result)) {
        ResponseHelper.list(reply, result);
      } else {
        ResponseHelper.success(reply, result);
      }
    } catch (error) {
      if (reply.sent) {
        return;
      }

      const errorMessage = error instanceof Error ? error.message : "未知错误";
      ResponseHelper.internalError(reply, "请求处理失败", errorMessage);
    }
  };
}
