import { Logger, logger } from "../../config/logger/logger";

// 请求日志中间件
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress
    };

    if (res.statusCode >= 400) {
      logger.warn("HTTP Request", logData);
    } else {
      logger.http("HTTP Request", logData);
    }
  });

  next();
};

// 错误日志记录器
export const logError = (error: Error, context?: any) => {
  logger.error("Application Error", {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

// 数据库操作日志
export const logDatabaseOperation = (
  operation: string,
  collection: string,
  data?: any
) => {
  logger.info("Database Operation", {
    operation,
    collection,
    data: data ? JSON.stringify(data) : undefined,
    timestamp: new Date().toISOString()
  });
};

// 性能监控日志
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: any
) => {
  const level = duration > 1000 ? "warn" : "info";
  logger[level]("Performance Monitor", {
    operation,
    duration: `${duration}ms`,
    metadata,
    timestamp: new Date().toISOString()
  });
};

// 业务逻辑日志
export const logBusiness = (action: string, userId?: string, data?: any) => {
  logger.info("Business Logic", {
    action,
    userId,
    data,
    timestamp: new Date().toISOString()
  });
};

// 安全事件日志
export const logSecurity = (event: string, details: any) => {
  logger.warn("Security Event", {
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

// 创建带上下文的日志器
export const createContextLogger = (context: string): Logger => {
  return {
    error: (message: string, meta?: any) =>
      logger.error(`[${context}] ${message}`, meta),
    warn: (message: string, meta?: any) =>
      logger.warn(`[${context}] ${message}`, meta),
    info: (message: string, meta?: any) =>
      logger.info(`[${context}] ${message}`, meta),
    http: (message: string, meta?: any) =>
      logger.http(`[${context}] ${message}`, meta),
    debug: (message: string, meta?: any) =>
      logger.debug(`[${context}] ${message}`, meta)
  };
};

// 导出默认日志器
export default logger;
