import { Enforcer, newEnforcer } from "casbin";
import { PrismaAdapter } from "casbin-prisma-adapter";
import path from "path";
import { KEY } from "../key";
import { ErrorFactory } from "../../utils/errors/custom-errors";
import logger from "../logger/logger";
import { PermissionResult, RequestContext } from "./ormManager";

export class PrismaManager {
  private enforcer: Enforcer | null = null;
  private pgAdapter: PrismaAdapter | null = null;
  private mongoAdapter: PrismaAdapter | null = null;
  private useMongoDB: boolean = false;
  private modelPath: string;
  private isInitialized: boolean = false;

  constructor(useMongoDB: boolean = false, modelPath?: string) {
    this.useMongoDB = useMongoDB;
    this.modelPath = modelPath || path.join(process.cwd(), "model.conf");
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        logger.info("PrismaManager 已经初始化");
        return;
      }

      if (this.useMongoDB) {
        this.mongoAdapter = await PrismaAdapter.newAdapter({
          type: "mongodb",
          host: KEY.mongodbHost,
          port: KEY.mongodbPort,
          username: KEY.mongodbUser,
          password: KEY.mongodbPassword,
          database: KEY.mongodbCasbinDatabase
        });
      } else {
        this.pgAdapter = await PrismaAdapter.newAdapter({
          type: "postgres",
          host: KEY.postgresHost,
          port: KEY.postgresPort,
          username: KEY.postgresUser,
          password: KEY.postgresPassword,
          database: KEY.postgresCasbinDatabase,
          synchronize: true,
          logging: true
        });
      }

      this.enforcer = await newEnforcer(
        this.modelPath,
        this.useMongoDB ? this.mongoAdapter : this.pgAdapter
      );

      this.enforcer.enableAutoSave(true);

      this.isInitialized = true;
    } catch (error: any) {
      throw ErrorFactory.configuration(
        "PrismaManager 初始化失败",
        error.message
      );
    }
  }

  async checkPermission(context: RequestContext): Promise<PermissionResult> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");
    try {
      const allowed = await this.enforcer.enforce(
        context.sub,
        context.obj,
        context.act,
        context.env || ""
      );

      return { allowed, reason: allowed ? "权限检查通过" : "权限检查失败" };
    } catch (_error: any) {
      return { allowed: false, reason: "权限检查失败" };
    }
  }
}
