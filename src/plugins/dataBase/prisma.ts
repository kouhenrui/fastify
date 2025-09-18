import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import {
  closePrisma,
  initializePrisma,
  postgresPrisma
} from "../../config/orm/prisma";
import { logger } from "../../config/logger/logger";
import { KEY } from "../../config/key";
import { ErrorFactory } from "../../utils/errors/custom-errors";

// Prisma 插件选项
interface PrismaOptions {
  autoInitialize?: boolean;
}

// Prisma 插件
const prismaPlugin: FastifyPluginAsync<PrismaOptions> = async (
  fastify,
  options = {}
) => {
  const { autoInitialize = true } = options;

  // 初始化 Prisma 连接
  if (autoInitialize) {
    try {
      await initializePrisma();

      // 将 Prisma 客户端添加到 fastify 实例
      fastify.decorate("prisma", {
        postgres: postgresPrisma
      });

      // 添加便捷的数据库访问方法
      fastify.decorate("getPostgresPrisma", () => {
        if (!KEY.enablePostgres) {
          throw new Error("PostgreSQL 未启用");
        }
        return postgresPrisma;
      });

      // 添加事务支持
      fastify.decorate(
        "postgresTransaction",
        async <T>(
          callback: (prisma: typeof postgresPrisma) => Promise<T>
        ): Promise<T> => {
          if (!KEY.enablePostgres) {
            throw ErrorFactory.configuration("PostgreSQL 未启用");
          }
          return await postgresPrisma.$transaction(callback);
        }
      );

      // 优雅关闭
      fastify.addHook("onClose", async () => {
        await closePrisma();
        logger.info("Prisma 连接已关闭");
      });

      logger.info("Prisma 插件已注册");
    } catch (error: any) {
      logger.error("Prisma 插件初始化失败", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw ErrorFactory.configuration("Prisma 初始化失败", error.message);
    }
  } else {
    // 仅注册客户端，不自动初始化
    fastify.decorate("prisma", {
      postgres: postgresPrisma
    });
    logger.info("Prisma 插件已注册（未自动初始化）");
  }
};

// 类型声明
declare module "fastify" {
  interface FastifyInstance {
    prisma: {
      postgres: typeof postgresPrisma;
    };
    getPostgresPrisma: () => typeof postgresPrisma;

    postgresTransaction: <T>(
      callback: (prisma: typeof postgresPrisma) => Promise<T>
    ) => Promise<T>;
    prismaHealthCheck: () => Promise<{
      postgres: boolean;
      mongodb: boolean;
    }>;
  }
}

export default fp(prismaPlugin, {
  name: "prisma"
});
