/**
 * MongoDB模型导出和连接管理
 */

import mongoose, { Connection, Document, Model, Schema } from "mongoose";
import logger from "../../config/logger/logger";
import { ErrorFactory } from "../../utils/errors/custom-errors";

// 模型注册表
interface ModelRegistry {
  [key: string]: {
    schema: Schema;
    model: Model<Document>;
  };
}

// MongoDB 模型管理器
export class MongoModel {
  private static _connection: Connection | null;
  private static _models: ModelRegistry = {};
  private static _isInitialized = false;

  /**
   * 获取指定模型
   */
  static getModel<T extends Document>(name: string): Model<T> {
    return this._models[name]?.model as unknown as Model<T>;
  }

  /**
   * 注册模型
   */
  static registerModel<T extends Document>(
    name: string,
    schema: Schema,
    collectionName: string
  ): Model<T> {
    if (this._models[name]) {
      logger.warn(`模型 ${name} 已存在，将被覆盖`);
    }
    // 使用当前连接创建模型
    const model = this._connection
      ? this._connection.model<T>(name, schema, collectionName)
      : mongoose.model<T>(name, schema, collectionName);
    this._models[name] = { schema, model: model as unknown as Model<Document> };

    logger.info(`模型 ${name} 注册成功`);
    return model;
  }

  /**
   * 初始化 MongoDB 连接
   */
  static async init(
    uri: string,
    options: mongoose.ConnectOptions
  ): Promise<Connection> {
    if (this._isInitialized) {
      logger.warn("MongoDB 模型已初始化");
      return this._connection as Connection;
    }
    try {
      this._connection = await mongoose.createConnection(uri, options);
      // 设置连接事件监听
      this._connection.on("connected", () => {
        logger.info("MongoDB 已连接", {
          host: this._connection?.host,
          port: this._connection?.port,
          database: this._connection?.name
        });
      });

      this._connection.on("error", (error) => {
        logger.error("MongoDB 连接错误", { error: error.message });
      });

      this._connection.on("disconnected", () => {
        logger.warn("MongoDB 连接断开");
      });

      this._isInitialized = true;
      return this._connection as Connection;
    } catch (error: any) {
      logger.error("MongoDB 连接初始化失败:", error);
      throw ErrorFactory.configuration(
        `MongoDB 连接初始化失败: ${error.message}`
      );
    }
  }

  /**
   * 获取连接状态
   */
  static getConnectionState(): number {
    return this._connection?.readyState || 0;
  }

  /**
   * 关闭连接
   */
  static async close(): Promise<void> {
    if (this._connection) {
      await this._connection.close();
      this._connection = null;
      this._isInitialized = false;
      logger.info("MongoDB 连接已关闭");
    }
  }

  /**
   * 获取连接实例
   */
  static getConnection(): Connection | null {
    return this._connection;
  }

  /**
   * 清空所有数据
   */
  static async clearAllData(): Promise<void> {
    if (!this._connection) {
      throw new Error("MongoDB 连接未初始化");
    }

    try {
      for (const [name, { model }] of Object.entries(this._models)) {
        await model.deleteMany({});
        logger.info(`模型 ${name} 数据已清空`);
      }
    } catch (error) {
      logger.error("清空数据失败:", error);
      throw error;
    }
  }
}

// 导出常用类型
export type { ModelRegistry };
