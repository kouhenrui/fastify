import mongoose, { Model } from "mongoose";
import { IBaseModel, createBaseSchema } from ".";

export interface IResource extends IBaseModel {
  name: string; // 资源名称
  code: string; // 资源编码
  type: string; // 资源类型
  path: string; // 资源路径
  method: string; // 资源方法
}

// 使用工厂函数创建 schema
const resourceSchema = createBaseSchema<IResource>({
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, required: true },
  path: { type: String, required: true },
  method: { type: String, required: true }
}, {
  collection: "resources"
});

// Resource 特定索引
resourceSchema.index({ code: 1, isActive: 1, deletedAt: 1 });

resourceSchema.statics.findByCode = function (code: string) {
  return this.findOne({ code, isActive: true, deletedAt: null });
};
resourceSchema.statics.findByType = function (type: string) {
  return this.find({ type, isActive: true, deletedAt: null });
};
resourceSchema.statics.findAll = function () {
  return this.find({ isActive: true, deletedAt: null });
};

// 基础软删除方法和 pre 钩子已在工厂函数中添加

// 静态方法接口
interface IResourceModel extends Model<IResource> {
  findByCode(code: string): Promise<IResource | null>;
  findByType(type: string): Promise<IResource[]>;
  findAll(): Promise<IResource[]>;
  softDelete(id: string, deletedBy?: string): Promise<IResource | null>;
}

const Resource: IResourceModel = mongoose.model<IResource, IResourceModel>(
  "Resource",
  resourceSchema
);

export default Resource;
