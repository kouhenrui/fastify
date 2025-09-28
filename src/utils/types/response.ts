// 统一响应格式类型定义

// 成功响应接口
export interface SuccessResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  requestId?: string;
}

// 错误响应接口
export interface ErrorResponse {
  code: number;
  message: string;
  error: string;
  details?: any;
  timestamp: number;
  requestId?: string;
}

// 分页响应接口
export interface PaginatedResponse<T = any> {
  code: number;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  timestamp: number;
  requestId?: string;
}

// 列表响应接口
export interface ListResponse<T = any> {
  code: number;
  message: string;
  data: {
    items: T[];
    count: number;
  };
  timestamp: number;
  requestId?: string;
}

// 统一响应类型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// 分页参数接口
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// 分页查询参数接口
export interface PaginationQuery {
  page: number;
  limit: number;
  offset: number;
  sort: string;
  order: "asc" | "desc";
}

// 标准 HTTP 状态码
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503
}

// 业务状态码
export enum BusinessCode {
  SUCCESS = 0,
  VALIDATION_ERROR = 1001,
  AUTHENTICATION_ERROR = 1002,
  AUTHORIZATION_ERROR = 1003,
  RESOURCE_NOT_FOUND = 1004,
  RESOURCE_CONFLICT = 1005,
  DATABASE_ERROR = 2001,
  EXTERNAL_SERVICE_ERROR = 2002,
  UNKNOWN_ERROR = 9999
}

export interface User {
  id: string;
  username: string;
  roles: string[];
  [key: string]: any;
}
