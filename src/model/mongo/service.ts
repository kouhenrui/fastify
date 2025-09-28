import mongoose, { Model } from "mongoose";
import { IBaseModel, createSchema } from ".";

// 家政服务接口
export interface IService extends IBaseModel {
  name: string; // 服务名称
  description: string; // 服务描述
  category: string; // 服务分类
  price: number; // 服务价格
  unit: 'hour' | 'day' | 'time' | 'square'; // 计费单位
  duration?: number; // 服务时长（小时）
  area?: number; // 服务面积（平方米）
  images?: string[]; // 服务图片
  tags?: string[]; // 服务标签
  isActive: boolean; // 是否启用
  merchantId: string; // 商家ID
  requirements?: {
    minArea?: number; // 最小面积要求
    maxArea?: number; // 最大面积要求
    tools?: string[]; // 需要工具
    materials?: string[]; // 需要材料
    experience?: string; // 经验要求
  }; // 服务要求
}

// 家政服务 Schema
const serviceSchema = createSchema<IService>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['hour', 'day', 'time', 'square'],
      required: true
    },
    duration: {
      type: Number,
      min: 0
    },
    area: {
      type: Number,
      min: 0
    },
    images: [{
      type: String,
      trim: true
    }],
    tags: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    merchantId: {
      type: String,
      required: true,
      ref: 'Account',
      index: true
    },
    requirements: {
      minArea: {
        type: Number,
        min: 0
      },
      maxArea: {
        type: Number,
        min: 0
      },
      tools: [{
        type: String,
        trim: true
      }],
      materials: [{
        type: String,
        trim: true
      }],
      experience: {
        type: String,
        trim: true
      }
    }
  },
  "services"
);

// 静态方法
serviceSchema.statics.findByMerchant = function (merchantId: string) {
  return this.find({ merchantId, isActive: true, deletedAt: null });
};

serviceSchema.statics.findByCategory = function (category: string) {
  return this.find({ category, isActive: true, deletedAt: null });
};

serviceSchema.statics.findActiveServices = function () {
  return this.find({ isActive: true, deletedAt: null });
};

// 静态方法接口
interface IServiceModel extends Model<IService> {
  findByMerchant(merchantId: string): Promise<IService[]>;
  findByCategory(category: string): Promise<IService[]>;
  findActiveServices(): Promise<IService[]>;
}

// 创建模型
const Service: IServiceModel = mongoose.model<IService, IServiceModel>(
  "Service",
  serviceSchema
);

export default Service;
