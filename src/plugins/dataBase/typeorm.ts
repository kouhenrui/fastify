import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import {
  closeAllDataSources,
  initializeAllDataSources,
  mongoDataSource,
  postgresDataSource,
  typeormHealthCheck
} from "../../config/orm/typeorm";
import { ErrorFactory } from "../../utils/errors/custom-errors";

interface TypeormOptions {
  autoInitialize?: boolean;
}

const typeormPlugin: FastifyPluginAsync<TypeormOptions> = async (
  fastify,
  options = {}
) => {
  const { autoInitialize = true } = options;

  if (autoInitialize) {
    try {
      await initializeAllDataSources();
      fastify.decorate("typeorm", {
        postgres: postgresDataSource,
        mongo: mongoDataSource
      });
      fastify.decorate("getPostgresDataSource", () => {
        return postgresDataSource;
      });
      fastify.decorate("getMongoDataSource", () => {
        return mongoDataSource;
      });
      fastify.decorate("typeormHealthCheck", async () => {
        return await typeormHealthCheck();
      });
      fastify.addHook("onClose", async () => {
        await closeAllDataSources();
      });
    } catch (error: any) {
      throw ErrorFactory.configuration("TypeORM 初始化失败", error.message);
    }
  } else {
    fastify.decorate("typeorm", {
      postgres: postgresDataSource,
      mongo: mongoDataSource
    });
  }
};

declare module "fastify" {
  interface FastifyInstance {
    typeorm: {
      postgres: typeof postgresDataSource;
      mongo: typeof mongoDataSource;
    };
  }
  interface FastifyInstance {
    getPostgresDataSource: () => typeof postgresDataSource;
    getMongoDataSource: () => typeof mongoDataSource;
    // postgresTransaction: <T>(callback: (dataSource: typeof postgresDataSource) => Promise<T>) => Promise<T>;
    // mongoTransaction: <T>(callback: (dataSource: typeof mongoDataSource) => Promise<T>) => Promise<T>;
    typeormHealthCheck: () => Promise<{
      postgres: boolean;
      mongodb: boolean;
    }>;
  }
}

export default fp(typeormPlugin, {
  name: "typeorm"
});
