/**
 * MongoDB模型导出和连接管理
 */

import { Document, Schema } from "mongoose";
import Role from "./role";
import Resource from "./resource";
import Account from "./account";
import ABAC_INIT_DATA from "../../config/casbin/abac-data";
import logger from "../../utils/logger/logger";

export interface IBaseModel extends Document {
  _id: string; // 主键
  extra?: Record<string, any>; // 额外字段
  deletedAt?: Date; // 删除时间
  deletedBy?: string; // 删除者
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  isActive: boolean; // 是否激活
}

// 基础字段定义
export const baseFields = {
  extra: {
    type: Schema.Types.Mixed,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: String,
    default: null
  }
};

// 基础选项
export const baseOptions = {
  timestamps: true,
  versionKey: false
};

// 创建基础 Schema 的工厂函数
export function createBaseSchema<T>(specificFields: any, options: any = {}) {
  const schema = new Schema<T>(
    {
      ...specificFields,
      ...baseFields
    },
    {
      ...baseOptions,
      ...options
    }
  );

  // 添加基础索引
  schema.index({ isActive: 1, deletedAt: 1 });
  schema.index({ createdAt: -1 });
  schema.index({ updatedAt: -1 });

  // 添加基础虚拟字段
  schema.virtual("isDeleted").get(function (this: any) {
    return this.deletedAt !== null;
  });

  // 添加基础方法
  schema.methods.toSafeObject = function () {
    const obj = this.toObject();
    return obj;
  };

  // 添加基础静态方法
  schema.statics.softDelete = function (id: string, deletedBy?: string) {
    return this.findByIdAndUpdate(id, {
      deletedAt: new Date(),
      deletedBy: deletedBy || "system"
    });
  };

  // 添加基础 pre 钩子
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
    // 检查并初始化角色数据
    const existingRoles = await Role.countDocuments();
    if (existingRoles === 0) await Role.create(ABAC_INIT_DATA.roles);

    // 检查并初始化资源数据
    const existingResources = await Resource.countDocuments();
    if (existingResources === 0)
      await Resource.create(ABAC_INIT_DATA.resources);

    // 检查并创建默认管理员账户
    const existingAdmin = await Account.findOne({ username: "admin" });
    if (!existingAdmin) await Account.create(ABAC_INIT_DATA.defaultAdmin);
  } catch (error: any) {
    logger.error("初始化基础数据失败", {
      error: error.message
    });
  }
}
