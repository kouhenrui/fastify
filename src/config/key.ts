export const KEY = {
  // 服务器配置
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  serverName: process.env.SERVER_NAME || "fastify-app",
  secretKey: process.env.SECRET_KEY || "secret-key",
  apiVersion: process.env.API_VERSION || "v1",

  // MongoDB 配置
  mongodbUri:
    process.env.MONGODB_URI ||
    "mongodb://root:123456@localhost:27017/fastify-app?authSource=admin",
  mongodbUser: process.env.MONGODB_USER || "root",
  mongodbPassword: process.env.MONGODB_PASSWORD || "123456",
  mongodbHost: process.env.MONGODB_HOST || "localhost",
  mongodbPort: parseInt(process.env.MONGODB_PORT || "27017"),
  mongodbCasbinDatabase: process.env.MONGODB_CASBIN_DATABASE || "casbin",

  // Redis 配置
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: parseInt(process.env.REDIS_PORT || "6379"),
  redisPassword: process.env.REDIS_PASSWORD || "123456",
  redisDb: parseInt(process.env.REDIS_DB || "0"),

  // PostgreSQL 配置
  enablePostgres: process.env.ENABLE_POSTGRES || false,
  postgresHost: process.env.POSTGRES_HOST || "localhost",
  postgresPort: parseInt(process.env.POSTGRES_PORT || "5432"),
  postgresDatabase: process.env.POSTGRES_DATABASE || "fastify-app",
  postgresCasbinDatabase: process.env.POSTGRES_CASBIN_DATABASE || "casbin",
  postgresUser: process.env.POSTGRES_USER || "postgres",
  postgresPassword: process.env.POSTGRES_PASSWORD || "password",
  postgresSsl: process.env.POSTGRES_SSL || false,

  // 数据库连接池配置
  dbPoolMin: parseInt(process.env.DB_POOL_MIN || "2"),
  dbPoolMax: parseInt(process.env.DB_POOL_MAX || "10"),

  // Prisma 配置
  postgresUrl:
    process.env.POSTGRES_URL ||
    `postgresql://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "password"}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DATABASE || "fastify-app"}?schema=public`,
  mongodbUrl:
    process.env.MONGODB_URL ||
    `mongodb://root:123456@localhost:27017/fastify-app`,

  // 日志配置
  logLevel: process.env.LOG_LEVEL || "info",
  logFileMaxSize: process.env.LOG_FILE_MAX_SIZE || "20m",
  logFileMaxFiles: process.env.LOG_FILE_MAX_FILES || "14d",
  logErrorMaxFiles: process.env.LOG_ERROR_MAX_FILES || "30d"
};
