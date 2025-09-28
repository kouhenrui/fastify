import mongoose, { Model } from "mongoose";
import { IBaseModel, createSchema } from ".";

// 订单状态枚举
export type OrderStatus = 
  | 'pending'      // 待接单
  | 'accepted'     // 已接单
  | 'in_progress'  // 进行中
  | 'completed'    // 已完成
  | 'cancelled'    // 已取消
  | 'refunded';    // 已退款

// 支付状态枚举
export type PaymentStatus = 
  | 'unpaid'       // 未支付
  | 'paid'         // 已支付
  | 'refunded'     // 已退款
  | 'partial_refund'; // 部分退款

// 订单接口
export interface IOrder extends IBaseModel {
  orderNo: string; // 订单号
  customerId: string; // 客户ID
  merchantId: string; // 商家ID
  serviceId: string; // 服务ID
  status: OrderStatus; // 订单状态
  paymentStatus: PaymentStatus; // 支付状态
  
  // 服务信息
  serviceInfo: {
    name: string; // 服务名称
    description: string; // 服务描述
    price: number; // 单价
    unit: string; // 计费单位
    quantity: number; // 数量
    totalPrice: number; // 总价
  };
  
  // 服务地址
  serviceAddress: {
    type: 'home' | 'work' | 'other';
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    contactName: string; // 联系人姓名
    contactPhone: string; // 联系人电话
  };
  
  // 服务时间
  serviceTime: {
    scheduledDate: Date; // 预约日期
    scheduledTime: string; // 预约时间段
    estimatedDuration: number; // 预计时长（小时）
    actualStartTime?: Date; // 实际开始时间
    actualEndTime?: Date; // 实际结束时间
  };
  
  // 支付信息
  payment: {
    method: 'wechat' | 'alipay' | 'card' | 'cash'; // 支付方式
    amount: number; // 支付金额
    paidAt?: Date; // 支付时间
    transactionId?: string; // 交易ID
  };
  
  // 评价信息
  rating?: {
    score: number; // 评分 1-5
    comment?: string; // 评价内容
    images?: string[]; // 评价图片
    ratedAt: Date; // 评价时间
  };
  
  // 取消/退款信息
  cancellation?: {
    reason: string; // 取消原因
    cancelledBy: 'customer' | 'merchant' | 'system'; // 取消方
    cancelledAt: Date; // 取消时间
    refundAmount?: number; // 退款金额
  };
  
  // 备注信息
  notes?: string; // 订单备注
  customerNotes?: string; // 客户备注
  merchantNotes?: string; // 商家备注
}

// 订单 Schema
const orderSchema = createSchema<IOrder>(
  {
    orderNo: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      ref: 'Account',
      index: true
    },
    merchantId: {
      type: String,
      required: true,
      ref: 'Account',
      index: true
    },
    serviceId: {
      type: String,
      required: true,
      ref: 'Service',
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'partial_refund'],
      default: 'unpaid',
      index: true
    },
    serviceInfo: {
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        required: true,
        trim: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0
      }
    },
    serviceAddress: {
      type: {
        type: String,
        enum: ['home', 'work', 'other'],
        required: true
      },
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180
        }
      },
      contactName: {
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
      }
    },
    serviceTime: {
      scheduledDate: {
        type: Date,
        required: true
      },
      scheduledTime: {
        type: String,
        required: true,
        trim: true
      },
      estimatedDuration: {
        type: Number,
        required: true,
        min: 0
      },
      actualStartTime: {
        type: Date
      },
      actualEndTime: {
        type: Date
      }
    },
    payment: {
      method: {
        type: String,
        enum: ['wechat', 'alipay', 'card', 'cash'],
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      paidAt: {
        type: Date
      },
      transactionId: {
        type: String,
        trim: true
      }
    },
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        trim: true,
        maxlength: 500
      },
      images: [{
        type: String,
        trim: true
      }],
      ratedAt: {
        type: Date
      }
    },
    cancellation: {
      reason: {
        type: String,
        trim: true,
        maxlength: 200
      },
      cancelledBy: {
        type: String,
        enum: ['customer', 'merchant', 'system']
      },
      cancelledAt: {
        type: Date
      },
      refundAmount: {
        type: Number,
        min: 0
      }
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    customerNotes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    merchantNotes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  "orders"
);

// 实例方法
orderSchema.methods.updateStatus = function (status: OrderStatus, notes?: string) {
  this.status = status;
  if (notes) {
    this.merchantNotes = notes;
  }
  return this.save();
};

orderSchema.methods.completeOrder = function (actualEndTime: Date) {
  this.status = 'completed';
  this.serviceTime.actualEndTime = actualEndTime;
  return this.save();
};

orderSchema.methods.cancelOrder = function (reason: string, cancelledBy: 'customer' | 'merchant' | 'system') {
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    cancelledBy,
    cancelledAt: new Date()
  };
  return this.save();
};

// 静态方法
orderSchema.statics.findByCustomer = function (customerId: string) {
  return this.find({ customerId, deletedAt: null }).sort({ createdAt: -1 });
};

orderSchema.statics.findByMerchant = function (merchantId: string) {
  return this.find({ merchantId, deletedAt: null }).sort({ createdAt: -1 });
};

orderSchema.statics.findByStatus = function (status: OrderStatus) {
  return this.find({ status, deletedAt: null }).sort({ createdAt: -1 });
};

orderSchema.statics.findByOrderNo = function (orderNo: string) {
  return this.findOne({ orderNo, deletedAt: null });
};

// 静态方法接口
interface IOrderModel extends Model<IOrder> {
  findByCustomer(customerId: string): Promise<IOrder[]>;
  findByMerchant(merchantId: string): Promise<IOrder[]>;
  findByStatus(status: OrderStatus): Promise<IOrder[]>;
  findByOrderNo(orderNo: string): Promise<IOrder | null>;
}

// 创建模型
const Order: IOrderModel = mongoose.model<IOrder, IOrderModel>(
  "Order",
  orderSchema
);

export default Order;
