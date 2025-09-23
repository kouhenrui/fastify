import { Enforcer, newEnforcer } from "casbin";
import { FastifyReply, FastifyRequest } from "fastify";
import path from "path";
import fs from "fs";
import TypeORMAdapter from "typeorm-adapter";
import { KEY } from "../key";
import { ErrorFactory } from "../../utils/errors/custom-errors";
import logger from "../logger/logger";
import ABAC_INIT_DATA from "./abac-data";

// 权限检查结果
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  matchedPolicies?: string[][];
}

// 请求上下文
export interface RequestContext {
  sub: string; // 主体 (用户)
  obj: string; // 对象 (资源)
  act: string; // 动作
  env?: string; // 环境
  eft?: string; // 效果
}

class ORMManager {
  private enforcer: Enforcer;
  private typeormAdapter: any = null;
  private useMongoDB: boolean = true;
  private modelPath: string;
  private isInitialized: boolean = false;

  constructor() {
    this.modelPath = path.join(process.cwd(), "model.conf");
  }

  /**
   * 异步初始化管理器
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        logger.info("ORMManager 已经初始化");
        return;
      }

      // 验证模型文件
      if (!this.validateModel())
        throw ErrorFactory.configuration("模型文件验证失败");

      if (this.useMongoDB) {
        this.typeormAdapter = await (TypeORMAdapter as any).default.newAdapter({
          type: "mongodb",
          url: KEY.mongodbUri
        });
      } else {
        this.typeormAdapter = await (TypeORMAdapter as any).default.newAdapter({
          type: "postgres",
          host: KEY.postgresHost,
          port: KEY.postgresPort,
          username: KEY.postgresUser,
          password: KEY.postgresPassword,
          database: KEY.postgresCasbinDatabase,
          synchronize: true,
          logging: false
        });
      }

      this.enforcer = await newEnforcer(this.modelPath, this.typeormAdapter);

      // 启用自动保存
      this.enforcer.enableAutoSave(true);

      this.isInitialized = true;
    } catch (error: any) {
      logger.error("ORMManager 初始化失败:", error);
      throw ErrorFactory.configuration(
        `ORMManager 初始化失败: ${error.message}`
      );
    }
  }

  /**
   * 检查权限
   */
  async checkPermission(context: RequestContext): Promise<PermissionResult> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");

    try {
      const allowed = await this.enforcer.enforce(
        context.sub,
        context.obj,
        context.act,
        context.env,
        context.eft
      );

      return { allowed, reason: allowed ? "权限检查通过" : "权限检查失败" };
    } catch (_error: any) {
      return { allowed: false, reason: "权限检查失败" };
    }
  }

  /**
   * 从请求中提取上下文
   */
  extractContext(request: FastifyRequest): RequestContext {
    // 从 JWT token 或 session 中获取用户信息
    const user = (request as any).user || (request as any).session?.user;

    // 从 URL 路径中提取资源信息
    const obj = this.extractResourceFromPath(request.url);

    // 从 HTTP 方法中提取动作
    const act = this.extractActionFromMethod(request.method);

    // 从请求头中提取环境信息
    const env = KEY.nodeEnv;

    return {
      sub: user?.id || user?._id || "anonymous",
      obj,
      act,
      env
    };
  }

  /**
   * 从 URL 路径中提取资源
   */
  private extractResourceFromPath(url: string): string {
    // 移除查询参数
    const path = url.split("?")[0] || "";

    // 提取资源类型
    const segments = path.split("/").filter(segment => segment) || [];

    if (segments.length === 0) return "root";
    if (segments[0] === KEY.apiVersion && segments.length > 1) {
      return segments[1] || ""; // 例如: /api/users -> users
    }

    return segments[0] || "unknown"; // 例如: /users -> users
  }

  /**
   * 从 HTTP 方法中提取动作
   */
  private extractActionFromMethod(method: string): string {
    const methodMap: Record<string, string> = {
      GET: "read",
      POST: "create",
      PUT: "update",
      PATCH: "update",
      DELETE: "delete"
    };

    return methodMap[method.toUpperCase()] || method.toLowerCase() || "unknown";
  }

  /**
   * 创建 onRequest 钩子
   */
  createOnRequestHook(
    options: {
      skipPaths?: string[];
      skipMethods?: string[];
      customExtractor?: (request: FastifyRequest) => RequestContext;
    } = {}
  ) {
    const { skipPaths = [], skipMethods = [], customExtractor } = options;

    return async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        // 跳过特定路径
        if (skipPaths.some(path => request.url.startsWith(path))) {
          return;
        }

        // 跳过特定方法
        if (skipMethods.includes(request.method)) {
          return;
        }

        // 提取上下文
        const context = customExtractor
          ? customExtractor(request)
          : this.extractContext(request);

        // 检查权限
        const result = await this.checkPermission(context);

        if (!result.allowed) throw ErrorFactory.authorization("Access Denied");

        // 将上下文附加到请求对象
        (request as any).casbinContext = context;
        (request as any).casbinResult = result;

        return;
      } catch (error: any) {
        throw ErrorFactory.configuration("Casbin 权限检查失败", error.message);
      }
    };
  }

  /**
   * 添加策略
   */
  async addPolicy(rule: string[]): Promise<boolean> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");
    return await this.enforcer.addPolicy(...rule);
  }

  /**
   * 移除策略
   */
  async removePolicy(rule: string[]): Promise<boolean> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");
    return await this.enforcer.removePolicy(...rule);
  }

  /**
   * 批量添加策略
   */
  async addPolicies(rules: string[][]): Promise<void> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");
    await this.enforcer.addPolicies(rules);
  }

  /**
   * 批量移除策略
   */
  async removePolicies(rules: string[][]): Promise<void> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");
    await this.enforcer.removePolicies(rules);
  }

  /**
   * 获取所有策略
   */
  async getAllPolicies(): Promise<string[][]> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");
    return this.enforcer.getPolicy();
  }

  /**
   * 获取策略统计
   */
  async getPolicyStats(): Promise<{
    total: number;
    p: number;
    g: number;
    g2: number;
  }> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");

    const policies = await this.getAllPolicies();
    return {
      total: policies.length,
      p: policies.filter(p => p[0] === "p").length,
      g: policies.filter(p => p[0] === "g").length,
      g2: policies.filter(p => p[0] === "g2").length
    };
  }

  /**
   * 删除用户
   */
  async deleteUser(user: string): Promise<boolean> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");
    return await this.enforcer.deleteUser(user);
  }
  /**
   * 删除角色
   */
  async deleteRole(role: string): Promise<boolean> {
    if (!this.enforcer) throw ErrorFactory.configuration("Enforcer 未初始化");
    return await this.enforcer.deleteRole(role);
  }

  /**
   * 验证模型配置
   */
  private validateModel(): boolean {
    try {
      if (!fs.existsSync(this.modelPath)) {
        logger.warn(`模型文件不存在: ${this.modelPath}`);
        return false;
      }
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * 获取模型文件路径
   */
  getModelPath(): string {
    return this.modelPath;
  }

  /**
   * 设置模型文件路径
   */
  setModelPath(modelPath: string): void {
    this.modelPath = modelPath;
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized && this.enforcer !== null;
  }
}
// 创建单例实例
const ormManager = new ORMManager();

// 导出实例和初始化方法
export default ormManager;

// 导出初始化方法，供应用启动时调用
export async function initializeORMManager(): Promise<void> {
  await ormManager.initialize();
  if (!(await ormManager.checkPermission(ABAC_INIT_DATA.defaultPolicy)))
    await ormManager.addPolicies(ABAC_INIT_DATA.policies);
}
