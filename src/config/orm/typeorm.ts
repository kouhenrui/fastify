import { DataSource, DataSourceOptions } from "typeorm";
import { logger } from "../logger/logger";
import { KEY } from "../key.js";
import { ErrorFactory } from "../../utils/errors/custom-errors";
import { postgresModel } from "../../model/postgres/index";

// PostgreSQL 数据源配置
const postgresConfig: DataSourceOptions = {
  type: "postgres",
  host: KEY.postgresHost,
  port: KEY.postgresPort,
  username: KEY.postgresUser,
  password: KEY.postgresPassword,
  database: KEY.postgresDatabase,
  entities: [...Object.values(postgresModel)],
  synchronize: KEY.nodeEnv === "development",
  logging: KEY.nodeEnv === "development",
  extra: {
    max: KEY.dbPoolMax,
    min: KEY.dbPoolMin,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  }
};

// MongoDB 数据源配置
const mongoConfig: DataSourceOptions = {
  type: "mongodb",
  host: KEY.mongodbHost,
  port: KEY.mongodbPort,
  username: KEY.mongodbUser,
  password: KEY.mongodbPassword,
  database: KEY.mongodbUri.split("/").pop()?.split("?")[0] || "fastify-app",
  synchronize: KEY.nodeEnv === "development",
  logging: KEY.nodeEnv === "development",
  extra: {
    maxPoolSize: KEY.dbPoolMax,
    minPoolSize: KEY.dbPoolMin,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 10000
  }
};

// 创建数据源实例
export const postgresDataSource = new DataSource(postgresConfig);
export const mongoDataSource = new DataSource(mongoConfig);

// 初始化 PostgreSQL 数据源
export const initializePostgresDataSource = async (): Promise<DataSource> => {
  try {
    if (!postgresDataSource.isInitialized) {
      await postgresDataSource.initialize();
      logger.info("PostgreSQL TypeORM 数据源已初始化");

      // 在开发环境运行迁移
      if (KEY.nodeEnv === "development") {
        await postgresDataSource.runMigrations();
        logger.info("PostgreSQL 数据库迁移已完成");
      }
    }
    return postgresDataSource;
  } catch (error: any) {
    logger.error("PostgreSQL TypeORM 初始化失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw ErrorFactory.configuration(
      "PostgreSQL TypeORM 初始化失败",
      error.message
    );
  }
};

// 初始化 MongoDB 数据源
export const initializeMongoDataSource = async (): Promise<DataSource> => {
  try {
    if (!mongoDataSource.isInitialized) {
      await mongoDataSource.initialize();
      logger.info("MongoDB TypeORM 数据源已初始化");
    }
    return mongoDataSource;
  } catch (error: any) {
    logger.error("MongoDB TypeORM 初始化失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw ErrorFactory.configuration(
      "MongoDB TypeORM 初始化失败",
      error.message
    );
  }
};

// 关闭 PostgreSQL 数据源
export const closePostgresDataSource = async (): Promise<void> => {
  try {
    if (postgresDataSource.isInitialized) {
      await postgresDataSource.destroy();
      logger.info("PostgreSQL TypeORM 数据源已关闭");
    }
  } catch (error: any) {
    logger.error("关闭 PostgreSQL TypeORM 数据源失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw ErrorFactory.configuration(
      "关闭 PostgreSQL TypeORM 数据源失败",
      error.message
    );
  }
};

// 关闭 MongoDB 数据源
export const closeMongoDataSource = async (): Promise<void> => {
  try {
    if (mongoDataSource.isInitialized) {
      await mongoDataSource.destroy();
      logger.info("MongoDB TypeORM 数据源已关闭");
    }
  } catch (error: any) {
    logger.error("关闭 MongoDB TypeORM 数据源失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw ErrorFactory.configuration(
      "关闭 MongoDB TypeORM 数据源失败",
      error.message
    );
  }
};

// 健康检查
export const typeormHealthCheck = async (): Promise<{
  postgres: boolean;
  mongodb: boolean;
}> => {
  const result = { postgres: false, mongodb: false };

  try {
    if (postgresDataSource.isInitialized) {
      await postgresDataSource.query("SELECT 1");
      result.postgres = true;
    }
  } catch (error: any) {
    logger.error("PostgreSQL TypeORM 健康检查失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  try {
    if (mongoDataSource.isInitialized) {
      await mongoDataSource.query("db.runCommand({ ping: 1 })");
      result.mongodb = true;
    }
  } catch (error) {
    logger.error("MongoDB TypeORM 健康检查失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  return result;
};

// 初始化所有数据源
export const initializeAllDataSources = async (): Promise<void> => {
  try {
    // 初始化 MongoDB（总是初始化）
    await initializeMongoDataSource();

    // 如果启用 PostgreSQL，则初始化
    if (KEY.enablePostgres) {
      await initializePostgresDataSource();
    }

    logger.info("所有 TypeORM 数据源已初始化");
  } catch (error) {
    logger.error("TypeORM 数据源初始化失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
};

// 关闭所有数据源
export const closeAllDataSources = async (): Promise<void> => {
  try {
    if (KEY.enablePostgres) {
      await closePostgresDataSource();
    }
    await closeMongoDataSource();
    logger.info("所有 TypeORM 数据源已关闭");
  } catch (error) {
    logger.error("关闭 TypeORM 数据源失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
};

export default {
  postgresDataSource,
  mongoDataSource,
  initializeAllDataSources,
  closeAllDataSources,
  typeormHealthCheck
};
