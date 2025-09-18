/**
 * MongoDB模型导出和连接管理
 */

import { Document } from "mongoose";
export interface IBaseModel extends Document {
  _id: string; // 主键
  deletedAt?: Date; // 删除时间
  deletedBy?: string; // 删除者
  createdAt: Date; // 创建时间
  updatedAt: Date; // 更新时间
  isActive: boolean; // 是否激活
}
