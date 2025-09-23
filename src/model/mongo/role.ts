import mongoose, { Model } from "mongoose";
import { IBaseModel, createBaseSchema } from ".";

export interface IRole extends IBaseModel {
  name: string; // 角色名称
  code: string; // 角色编码
  description?: string; // 角色描述
  level?: number; // 角色级别
}

// 使用工厂函数创建 schema
const roleSchema = createBaseSchema<IRole>({
  name: { type: String, required: true },
  description: { type: String, default: null },
  code: { type: String, required: true },
  level: { type: Number, default: 1 }
}, {
  collection: "roles"
});

// Role 特定索引
roleSchema.index({ code: 1, isActive: 1, deletedAt: 1 });

roleSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code, isActive: true, deletedAt: null });
};

roleSchema.statics.findByLevel = function (level: number) {
  return this.find({ level, isActive: true, deletedAt: null });
};

roleSchema.statics.findAll = function (skip: number, limit: number, sort: any) {
  return this.find({ isActive: true, deletedAt: null })
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .lean();
};

roleSchema.statics.frozeRole = function (id: string) {
  return this.findByIdAndUpdate(id, {
    isActive: false
  });
};

// 基础软删除方法已在工厂函数中添加

// 基础 pre 钩子已在工厂函数中添加

// 静态方法接口
interface IRoleModel extends Model<IRole> {
  findByCode(code: string): Promise<IRole | null>;
  findByLevel(level: number): Promise<IRole[]>;
  findAll(skip: number, limit: number, sort: any): Promise<IRole[]>;
  frozeRole(id: string): Promise<IRole | null>;
  softDelete(id: string, deletedBy?: string): Promise<IRole | null>;
}

const Role: IRoleModel = mongoose.model<IRole, IRoleModel>("Role", roleSchema);

export default Role;
