/**
 * CORS 工具函数
 */

/**
 * 验证 Origin 是否在允许列表中
 * @param origin 请求来源
 * @param allowedOrigins 允许的来源列表
 * @returns 是否允许
 */
export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (!origin) return false;

  return allowedOrigins.some(allowed => {
    // 支持通配符匹配
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }

    // 精确匹配
    return allowed === origin;
  });
}

/**
 * 生成 CORS 预检响应头
 * @param origin 请求来源
 * @param allowedOrigins 允许的来源列表
 * @param allowedMethods 允许的方法
 * @param allowedHeaders 允许的请求头
 * @param maxAge 缓存时间
 * @returns CORS 响应头
 */
export function generateCorsHeaders(
  origin: string,
  allowedOrigins: string[],
  allowedMethods: string[],
  allowedHeaders: string[],
  maxAge: number = 86400
): Record<string, string> {
  const headers: Record<string, string> = {};

  // 检查 Origin 是否允许
  if (isOriginAllowed(origin, allowedOrigins)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  headers['Access-Control-Allow-Methods'] = allowedMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = allowedHeaders.join(', ');
  headers['Access-Control-Max-Age'] = maxAge.toString();

  return headers;
}

/**
 * 检查是否为预检请求
 * @param method 请求方法
 * @param headers 请求头
 * @returns 是否为预检请求
 */
export function isPreflightRequest(method: string, headers: Record<string, string | string[] | undefined>): boolean {
  return method === 'OPTIONS' &&
         headers['access-control-request-method'] !== undefined;
}

/**
 * 获取客户端 IP 地址
 * @param request Fastify 请求对象
 * @returns IP 地址
 */
export function getClientIP(request: any): string {
  return request.ip ||
         request.headers['x-forwarded-for'] ||
         request.headers['x-real-ip'] ||
         request.connection?.remoteAddress ||
         'unknown';
}

/**
 * CORS 安全配置
 */
export const CORS_SECURITY_CONFIG = {
  // 生产环境推荐的严格配置
  production: {
    origin: false, // 需要明确指定允许的域名
    credentials: true,
    maxAge: 3600, // 1小时
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // 开发环境宽松配置
  development: {
    origin: true, // 允许所有来源
    credentials: true,
    maxAge: 86400, // 24小时
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  },

  // 测试环境配置
  test: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    maxAge: 0, // 不缓存
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
};

/**
 * 根据环境获取 CORS 配置
 * @param env 环境变量
 * @returns CORS 配置
 */
export function getCorsConfigByEnv(env: string = 'development') {
  switch (env) {
  case 'production':
    return CORS_SECURITY_CONFIG.production;
  case 'test':
    return CORS_SECURITY_CONFIG.test;
  default:
    return CORS_SECURITY_CONFIG.development;
  }
}

