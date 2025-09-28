/**
 * MongoDB模型导出和连接管理
 */

import { Document, Schema } from "mongoose";
import Role from "./role";
import Account from "./account";
import UserProfile from "./accountProfile";
import Service from "./service";
import Order from "./order";
import Merchant from "./merchant";
import OrderHistory from "./orderHistory";
import Payment from "./payment";
import ABAC_INIT_DATA from "../../config/casbin/abac-data";
import logger from "../../utils/logger/logger";
import Resource from "./resource";

export interface IBaseModel extends Document {
  _id: string; // 主键
  deletedAt?: Date; // 删除时间
  deletedBy?: string; // 删除者
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  isActive: boolean; // 是否激活

  // 软删除方法
  softDelete(userId?: string): Promise<IBaseModel>;
}

// 公共基础字段
function getBaseFields() {
  return {
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: null },
    extra: { type: Schema.Types.Mixed, default: null }
  };
}

// 创建 schema 工厂函数
export function createSchema<T>(specificFields: any, collection: string) {
  const fields = Object.assign({}, specificFields, getBaseFields());

  const schema = new Schema<T>(fields, {
    timestamps: true,
    versionKey: false,
    collection
  });
  schema.methods.softDelete = async function (userId?: string) {
    this.deletedAt = new Date();
    this.deletedBy = userId || null;
    return this.save();
  };
  schema.pre("findOne", function () {
    this.where({ deletedAt: null });
  });
  schema.pre("find", function () {
    this.where({ deletedAt: null });
  });
  return schema;
}
/**
 * 初始化基础数据
 */
export async function initializeBaseData() {
  try {
    // 并行检查数据是否存在
    const [role, account, resource] = await Promise.all([
      Role.countDocuments(),
      Account.countDocuments(),
      Resource.countDocuments()
    ]);

    logger.info(`📊 现有角色数量: ${role}`);
    logger.info(`📊 现有账户数量: ${account}`);
    logger.info(`📊 现有资源数量: ${resource}`);

    // 并行创建数据
    const promises = [];

    // 创建角色数据
    if (role === 0)
      promises.push(
        Role.insertMany(ABAC_INIT_DATA.roles).then(() => {
          logger.info("✅ 角色数据创建完成");
        })
      );

    // 创建默认管理员账户
    if (account === 0)
      promises.push(
        Account.create(ABAC_INIT_DATA.defaultAdmin).then(() => {
          logger.info("✅ 默认管理员账户创建完成");
        })
      );

    // 创建资源数据
    if (resource === 0)
      promises.push(
        Resource.insertMany(ABAC_INIT_DATA.resources).then(() => {
          logger.info("✅ 资源数据创建完成");
        })
      );

    // 等待所有创建操作完成
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  } catch (error: any) {
    logger.error("❌ 初始化基础数据失败", {
      error: error.message,
      stack: error.stack
    });
    throw error; // 重新抛出错误，让调用者知道失败
  }
}
