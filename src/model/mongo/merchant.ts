import mongoose, { Model } from "mongoose";
import { IBaseModel, createSchema } from ".";

// 商家状态枚举
export type MerchantStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// 商家信息接口
export interface IMerchant extends IBaseModel {
  accountId: string; // 关联的账户ID
  businessName: string; // 商家名称
  businessLicense: string; // 营业执照号
  businessLicenseImage: string; // 营业执照图片
  contactPerson: string; // 联系人
  contactPhone: string; // 联系电话
  contactEmail: string; // 联系邮箱
  
  // 商家信息
  businessInfo: {
    description: string; // 商家描述
    address: string; // 商家地址
    serviceAreas: string[]; // 服务区域
    serviceCategories: string[]; // 服务分类
    businessHours: {
      weekdays: string; // 工作日营业时间
      weekends: string; // 周末营业时间
    };
    establishedDate: Date; // 成立日期
  };
  
  // 认证信息
  verification: {
    status: MerchantStatus; // 认证状态
    verifiedAt?: Date; // 认证时间
    verifiedBy?: string; // 认证人
    rejectionReason?: string; // 拒绝原因
    documents: {
      businessLicense: string; // 营业执照
      idCard: string; // 身份证
      other?: string[]; // 其他证件
    };
  };
  
  // 服务能力
  serviceCapability: {
    maxConcurrentOrders: number; // 最大并发订单数
    serviceRadius: number; // 服务半径（公里）
    availableServices: string[]; // 可提供服务ID列表
    experience: string; // 从业经验
    certifications: string[]; // 资质证书
  };
  
  // 统计信息
  statistics: {
    totalOrders: number; // 总订单数
    completedOrders: number; // 已完成订单数
    averageRating: number; // 平均评分
    totalRevenue: number; // 总收入
    responseTime: number; // 平均响应时间（分钟）
  };
  
  // 银行信息
  bankInfo?: {
    accountName: string; // 账户名
    accountNumber: string; // 账户号
    bankName: string; // 银行名称
    bankBranch: string; // 开户行
  };
  
  // 设置信息
  settings: {
    autoAcceptOrders: boolean; // 自动接单
    notificationSettings: {
      newOrder: boolean; // 新订单通知
      orderUpdate: boolean; // 订单更新通知
      payment: boolean; // 支付通知
    };
    workingDays: number[]; // 工作日（0-6，0为周日）
    workingHours: {
      start: string; // 开始时间
      end: string; // 结束时间
    };
  };
}

// 商家信息 Schema
const merchantSchema = createSchema<IMerchant>(
  {
    accountId: {
      type: String,
      required: true,
      unique: true,
      ref: 'Account',
      index: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },
    businessLicense: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },
    businessLicenseImage: {
      type: String,
      required: true,
      trim: true
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
      match: [/^1[3-9]\d{9}$/, '请输入有效的手机号']
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
    },
    businessInfo: {
      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
      },
      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },
      serviceAreas: [{
        type: String,
        trim: true
      }],
      serviceCategories: [{
        type: String,
        trim: true
      }],
      businessHours: {
        weekdays: {
          type: String,
          required: true,
          trim: true
        },
        weekends: {
          type: String,
          required: true,
          trim: true
        }
      },
      establishedDate: {
        type: Date,
        required: true
      }
    },
    verification: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending',
        index: true
      },
      verifiedAt: {
        type: Date
      },
      verifiedBy: {
        type: String,
        trim: true
      },
      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 500
      },
      documents: {
        businessLicense: {
          type: String,
          required: true,
          trim: true
        },
        idCard: {
          type: String,
          required: true,
          trim: true
        },
        other: [{
          type: String,
          trim: true
        }]
      }
    },
    serviceCapability: {
      maxConcurrentOrders: {
        type: Number,
        default: 5,
        min: 1,
        max: 50
      },
      serviceRadius: {
        type: Number,
        default: 10,
        min: 1,
        max: 100
      },
      availableServices: [{
        type: String,
        ref: 'Service'
      }],
      experience: {
        type: String,
        trim: true,
        maxlength: 500
      },
      certifications: [{
        type: String,
        trim: true
      }]
    },
    statistics: {
      totalOrders: {
        type: Number,
        default: 0
      },
      completedOrders: {
        type: Number,
        default: 0
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0
      },
      responseTime: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    bankInfo: {
      accountName: {
        type: String,
        trim: true,
        maxlength: 100
      },
      accountNumber: {
        type: String,
        trim: true,
        maxlength: 50
      },
      bankName: {
        type: String,
        trim: true,
        maxlength: 100
      },
      bankBranch: {
        type: String,
        trim: true,
        maxlength: 100
      }
    },
    settings: {
      autoAcceptOrders: {
        type: Boolean,
        default: false
      },
      notificationSettings: {
        newOrder: {
          type: Boolean,
          default: true
        },
        orderUpdate: {
          type: Boolean,
          default: true
        },
        payment: {
          type: Boolean,
          default: true
        }
      },
      workingDays: [{
        type: Number,
        min: 0,
        max: 6
      }],
      workingHours: {
        start: {
          type: String,
          default: '08:00'
        },
        end: {
          type: String,
          default: '18:00'
        }
      }
    }
  },
  "merchants"
);

// 实例方法
merchantSchema.methods.updateStatistics = function (orderData: {
  totalOrders?: number;
  completedOrders?: number;
  averageRating?: number;
  totalRevenue?: number;
  responseTime?: number;
}) {
  Object.keys(orderData).forEach(key => {
    if (orderData[key as keyof typeof orderData] !== undefined) {
      (this.statistics as any)[key] = orderData[key as keyof typeof orderData];
    }
  });
  return this.save();
};

merchantSchema.methods.verifyMerchant = function (status: MerchantStatus, verifiedBy?: string, rejectionReason?: string) {
  this.verification.status = status;
  this.verification.verifiedAt = new Date();
  if (verifiedBy) {
    this.verification.verifiedBy = verifiedBy;
  }
  if (rejectionReason) {
    this.verification.rejectionReason = rejectionReason;
  }
  return this.save();
};

// 静态方法
merchantSchema.statics.findByAccountId = function (accountId: string) {
  return this.findOne({ accountId, deletedAt: null });
};

merchantSchema.statics.findByStatus = function (status: MerchantStatus) {
  return this.find({ 'verification.status': status, deletedAt: null });
};

merchantSchema.statics.findByServiceCategory = function (category: string) {
  return this.find({ 
    'businessInfo.serviceCategories': category, 
    'verification.status': 'approved',
    deletedAt: null 
  });
};

merchantSchema.statics.findByServiceArea = function (area: string) {
  return this.find({ 
    'businessInfo.serviceAreas': area, 
    'verification.status': 'approved',
    deletedAt: null 
  });
};

// 静态方法接口
interface IMerchantModel extends Model<IMerchant> {
  findByAccountId(accountId: string): Promise<IMerchant | null>;
  findByStatus(status: MerchantStatus): Promise<IMerchant[]>;
  findByServiceCategory(category: string): Promise<IMerchant[]>;
  findByServiceArea(area: string): Promise<IMerchant[]>;
}

// 创建模型
const Merchant: IMerchantModel = mongoose.model<IMerchant, IMerchantModel>(
  "Merchant",
  merchantSchema
);

export default Merchant;
