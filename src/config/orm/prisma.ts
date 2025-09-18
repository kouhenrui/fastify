import { PrismaClient } from "@prisma/client";
import { logger } from "../logger/logger.js";
import { KEY } from "../key.js";

// PostgreSQL 客户端
export const postgresPrisma = new PrismaClient({
  datasources: {
    postgres: {
      url: KEY.postgresUrl
    }
  },
  log: [
    {
      emit: "event",
      level: "query"
    },
    {
      emit: "event",
      level: "error"
    },
    {
      emit: "event",
      level: "info"
    },
    {
      emit: "event",
      level: "warn"
    }
  ]
});

// 设置日志监听器
postgresPrisma.$on("query", (e: any) => {
  if (KEY.nodeEnv === "development") {
    logger.debug("PostgreSQL Query", {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`
    });
  }
});

postgresPrisma.$on("error", (e: any) => {
  logger.error("PostgreSQL Error", { error: e.message });
});

// 初始化数据库连接
export const initializePrisma = async (): Promise<void> => {
  try {
    // 测试 PostgreSQL 连接
    if (KEY.enablePostgres) {
      await postgresPrisma.$connect();
      logger.info("PostgreSQL Prisma 客户端已连接");
    }
  } catch (error) {
    logger.error("Prisma 初始化失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
};

// 关闭数据库连接
export const closePrisma = async (): Promise<void> => {
  try {
    if (KEY.enablePostgres) {
      await postgresPrisma.$disconnect();
      logger.info("PostgreSQL Prisma 客户端已断开");
    }
  } catch (error) {
    logger.error("关闭 Prisma 连接失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
};

// 健康检查
export const prismaHealthCheck = async (): Promise<{
  postgres: boolean;
}> => {
  const result = { postgres: false };

  try {
    if (KEY.enablePostgres) {
      await postgresPrisma.$queryRaw`SELECT 1`;
      result.postgres = true;
    }
  } catch (error) {
    logger.error("PostgreSQL 健康检查失败", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }

  return result;
};

export default { postgresPrisma };
