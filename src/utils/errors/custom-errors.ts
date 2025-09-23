/**
 * 自定义错误类定义
 */

// 基础自定义错误类
export class CustomError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "CUSTOM_ERROR",
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// 业务逻辑错误
class BusinessError extends CustomError {
  constructor(message: string, code: string = "BUSINESS_ERROR", details?: any) {
    super(message, 666, code, details);
  }
}

// 验证错误
class ValidationError extends CustomError {
  public readonly validation: any;

  constructor(
    message: string,
    validation?: any,
    code: string = "VALIDATION_ERROR"
  ) {
    super(message, 400, code, validation);
    this.validation = validation;
  }
}

// 认证错误
class AuthenticationError extends CustomError {
  constructor(
    message: string = "认证失败",
    code: string = "AUTHENTICATION_ERROR"
  ) {
    super(message, 401, code);
  }
}

// 授权错误
class AuthorizationError extends CustomError {
  constructor(
    message: string = "权限不足",
    code: string = "AUTHORIZATION_ERROR"
  ) {
    super(message, 403, code);
  }
}

// 资源未找到错误
class NotFoundError extends CustomError {
  constructor(
    message: string = "资源未找到",
    code: string = "NOT_FOUND_ERROR"
  ) {
    super(message, 404, code);
  }
}

// 冲突错误
class ConflictError extends CustomError {
  constructor(message: string = "资源冲突", code: string = "CONFLICT_ERROR") {
    super(message, 409, code);
  }
}

// 数据库错误
class DatabaseError extends CustomError {
  constructor(message: string, code: string = "DATABASE_ERROR", details?: any) {
    super(message, 500, `DB_${code}`, details);
  }
}

// Redis 错误
class RedisError extends CustomError {
  constructor(message: string, code: string = "REDIS_ERROR", details?: any) {
    super(message, 500, `REDIS_${code}`, details);
  }
}

// 外部服务错误
class ExternalServiceError extends CustomError {
  constructor(
    service: string,
    message: string,
    code: string = "EXTERNAL_SERVICE_ERROR",
    details?: any
  ) {
    super(`${service}: ${message}`, 502, code, details);
  }
}

// 限流错误
class RateLimitError extends CustomError {
  constructor(
    message: string = "请求过于频繁",
    code: string = "RATE_LIMIT_ERROR",
    details?: any
  ) {
    super(message, 429, code, details);
  }
}

// 配置错误
class ConfigurationError extends CustomError {
  constructor(message: string, code: string = "CONFIGURATION_ERROR") {
    super(message, 500, code);
  }
}

// 网络错误
class NetworkError extends CustomError {
  constructor(message: string, code: string = "NETWORK_ERROR", details?: any) {
    super(message, 503, code, details);
  }
}

// 超时错误
class TimeoutError extends CustomError {
  constructor(message: string = "请求超时", code: string = "TIMEOUT_ERROR") {
    super(message, 408, code);
  }
}

// 文件操作错误
class FileError extends CustomError {
  constructor(message: string, code: string = "FILE_ERROR", details?: any) {
    super(message, 500, code, details);
  }
}

// 加密/解密错误
class CryptoError extends CustomError {
  constructor(message: string, code: string = "CRYPTO_ERROR") {
    super(message, 500, code);
  }
}

// 错误工厂类
export class ErrorFactory {
  /**
   * 创建业务逻辑错误
   */
  static business(
    message: string,
    code?: string,
    details?: any
  ): BusinessError {
    return new BusinessError(message, code, details);
  }

  /**
   * 创建验证错误
   */
  static validation(
    message: string,
    validation?: any,
    code?: string
  ): ValidationError {
    return new ValidationError(message, validation, code);
  }

  /**
   * 创建认证错误
   */
  static authentication(message?: string, code?: string): AuthenticationError {
    return new AuthenticationError(message, code);
  }

  /**
   * 创建授权错误
   */
  static authorization(message?: string, code?: string): AuthorizationError {
    return new AuthorizationError(message, code);
  }

  /**
   * 创建资源未找到错误
   */
  static notFound(message?: string, code?: string): NotFoundError {
    return new NotFoundError(message, code);
  }

  /**
   * 创建冲突错误
   */
  static conflict(message?: string, code?: string): ConflictError {
    return new ConflictError(message, code);
  }

  /**
   * 创建数据库错误
   */
  static database(
    message: string,
    code?: string,
    details?: any
  ): DatabaseError {
    return new DatabaseError(message, code, details);
  }

  /**
   * 创建 Redis 错误
   */
  static redis(message: string, code?: string, details?: any): RedisError {
    return new RedisError(message, code, details);
  }

  /**
   * 创建外部服务错误
   */
  static externalService(
    service: string,
    message: string,
    code?: string,
    details?: any
  ): ExternalServiceError {
    return new ExternalServiceError(service, message, code, details);
  }

  /**
   * 创建限流错误
   */
  static rateLimit(
    message?: string,
    code?: string,
    details?: any
  ): RateLimitError {
    return new RateLimitError(message, code, details);
  }

  /**
   * 创建配置错误
   */
  static configuration(message: string, code?: string): ConfigurationError {
    return new ConfigurationError(message, code);
  }

  /**
   * 创建网络错误
   */
  static network(message: string, code?: string, details?: any): NetworkError {
    return new NetworkError(message, code, details);
  }

  /**
   * 创建超时错误
   */
  static timeout(message?: string, code?: string): TimeoutError {
    return new TimeoutError(message, code);
  }

  /**
   * 创建文件错误
   */
  static file(message: string, code?: string, details?: any): FileError {
    return new FileError(message, code, details);
  }

  /**
   * 创建加密错误
   */
  static crypto(message: string, code?: string): CryptoError {
    return new CryptoError(message, code);
  }
}
