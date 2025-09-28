import mongoose, { Model } from "mongoose";
import { IBaseModel, createSchema } from ".";

// 支付状态枚举
export type PaymentStatus = 
  | 'pending'      // 待支付
  | 'processing'   // 处理中
  | 'success'      // 支付成功
  | 'failed'       // 支付失败
  | 'cancelled'    // 已取消
  | 'refunded'     // 已退款
  | 'partial_refund'; // 部分退款

// 支付方式枚举
export type PaymentMethod = 
  | 'wechat'       // 微信支付
  | 'alipay'       // 支付宝
  | 'bank_card'    // 银行卡
  | 'cash'         // 现金
  | 'balance';     // 余额支付

// 支付接口
export interface IPayment extends IBaseModel {
  paymentNo: string; // 支付单号
  orderId: string; // 关联订单ID
  orderNo: string; // 订单号
  customerId: string; // 客户ID
  merchantId: string; // 商家ID
  
  // 支付信息
  amount: number; // 支付金额
  currency: string; // 货币类型
  method: PaymentMethod; // 支付方式
  status: PaymentStatus; // 支付状态
  
  // 第三方支付信息
  thirdPartyPayment?: {
    provider: 'wechat' | 'alipay' | 'bank'; // 支付提供商
    transactionId?: string; // 第三方交易ID
    prepayId?: string; // 预支付ID（微信）
    qrCode?: string; // 二维码
    paymentUrl?: string; // 支付链接
    callbackUrl?: string; // 回调地址
  };
  
  // 支付时间
  paymentTime?: Date; // 支付时间
  expireTime?: Date; // 过期时间
  refundTime?: Date; // 退款时间
  
  // 退款信息
  refund?: {
    amount: number; // 退款金额
    reason: string; // 退款原因
    refundNo: string; // 退款单号
    thirdPartyRefundId?: string; // 第三方退款ID
    status: 'pending' | 'success' | 'failed'; // 退款状态
    processedBy?: string; // 处理人
    processedAt?: Date; // 处理时间
  };
  
  // 手续费信息
  fees: {
    platformFee: number; // 平台手续费
    paymentFee: number; // 支付手续费
    totalFee: number; // 总手续费
  };
  
  // 分账信息
  settlement?: {
    merchantAmount: number; // 商家分账金额
    platformAmount: number; // 平台分账金额
    settledAt?: Date; // 结算时间
    settlementNo?: string; // 结算单号
  };
  
  // 支付详情
  details: {
    description: string; // 支付描述
    clientIp?: string; // 客户端IP
    userAgent?: string; // 用户代理
    deviceInfo?: {
      type: 'mobile' | 'desktop' | 'tablet';
      os: string;
      browser: string;
    };
  };
  
  // 通知信息
  notifications: {
    customerNotified: boolean; // 客户是否已通知
    merchantNotified: boolean; // 商家是否已通知
    customerNotificationTime?: Date; // 客户通知时间
    merchantNotificationTime?: Date; // 商家通知时间
  };
  
  // 备注信息
  notes?: string; // 备注
  adminNotes?: string; // 管理员备注
}

// 支付 Schema
const paymentSchema = createSchema<IPayment>(
  {
    paymentNo: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: String,
      required: true,
      ref: 'Order',
      index: true
    },
    orderNo: {
      type: String,
      required: true,
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
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'CNY',
      trim: true
    },
    method: {
      type: String,
      enum: ['wechat', 'alipay', 'bank_card', 'cash', 'balance'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded', 'partial_refund'],
      default: 'pending',
      index: true
    },
    thirdPartyPayment: {
      provider: {
        type: String,
        enum: ['wechat', 'alipay', 'bank']
      },
      transactionId: {
        type: String,
        trim: true
      },
      prepayId: {
        type: String,
        trim: true
      },
      qrCode: {
        type: String,
        trim: true
      },
      paymentUrl: {
        type: String,
        trim: true
      },
      callbackUrl: {
        type: String,
        trim: true
      }
    },
    paymentTime: {
      type: Date
    },
    expireTime: {
      type: Date
    },
    refundTime: {
      type: Date
    },
    refund: {
      amount: {
        type: Number,
        min: 0
      },
      reason: {
        type: String,
        trim: true,
        maxlength: 200
      },
      refundNo: {
        type: String,
        trim: true
      },
      thirdPartyRefundId: {
        type: String,
        trim: true
      },
      status: {
        type: String,
        enum: ['pending', 'success', 'failed']
      },
      processedBy: {
        type: String,
        trim: true
      },
      processedAt: {
        type: Date
      }
    },
    fees: {
      platformFee: {
        type: Number,
        default: 0,
        min: 0
      },
      paymentFee: {
        type: Number,
        default: 0,
        min: 0
      },
      totalFee: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    settlement: {
      merchantAmount: {
        type: Number,
        min: 0
      },
      platformAmount: {
        type: Number,
        min: 0
      },
      settledAt: {
        type: Date
      },
      settlementNo: {
        type: String,
        trim: true
      }
    },
    details: {
      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
      },
      clientIp: {
        type: String,
        trim: true
      },
      userAgent: {
        type: String,
        trim: true
      },
      deviceInfo: {
        type: {
          type: String,
          enum: ['mobile', 'desktop', 'tablet']
        },
        os: {
          type: String,
          trim: true
        },
        browser: {
          type: String,
          trim: true
        }
      }
    },
    notifications: {
      customerNotified: {
        type: Boolean,
        default: false
      },
      merchantNotified: {
        type: Boolean,
        default: false
      },
      customerNotificationTime: {
        type: Date
      },
      merchantNotificationTime: {
        type: Date
      }
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  "payments"
);

// 实例方法
paymentSchema.methods.updateStatus = function (status: PaymentStatus, notes?: string) {
  this.status = status;
  if (notes) {
    this.adminNotes = notes;
  }
  if (status === 'success') {
    this.paymentTime = new Date();
  }
  return this.save();
};

paymentSchema.methods.processRefund = function (refundData: {
  amount: number;
  reason: string;
  refundNo: string;
  processedBy?: string;
}) {
  this.status = 'refunded';
  this.refundTime = new Date();
  this.refund = {
    amount: refundData.amount,
    reason: refundData.reason,
    refundNo: refundData.refundNo,
    status: 'success',
    processedBy: refundData.processedBy,
    processedAt: new Date()
  };
  return this.save();
};

paymentSchema.methods.markNotificationSent = function (type: 'customer' | 'merchant') {
  if (type === 'customer') {
    this.notifications.customerNotified = true;
    this.notifications.customerNotificationTime = new Date();
  } else {
    this.notifications.merchantNotified = true;
    this.notifications.merchantNotificationTime = new Date();
  }
  return this.save();
};

// 静态方法
paymentSchema.statics.findByOrderId = function (orderId: string) {
  return this.find({ orderId, deletedAt: null }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByOrderNo = function (orderNo: string) {
  return this.find({ orderNo, deletedAt: null }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByCustomer = function (customerId: string) {
  return this.find({ customerId, deletedAt: null }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByMerchant = function (merchantId: string) {
  return this.find({ merchantId, deletedAt: null }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByStatus = function (status: PaymentStatus) {
  return this.find({ status, deletedAt: null }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByPaymentNo = function (paymentNo: string) {
  return this.findOne({ paymentNo, deletedAt: null });
};

paymentSchema.statics.findByTransactionId = function (transactionId: string) {
  return this.findOne({ 'thirdPartyPayment.transactionId': transactionId, deletedAt: null });
};

// 静态方法接口
interface IPaymentModel extends Model<IPayment> {
  findByOrderId(orderId: string): Promise<IPayment[]>;
  findByOrderNo(orderNo: string): Promise<IPayment[]>;
  findByCustomer(customerId: string): Promise<IPayment[]>;
  findByMerchant(merchantId: string): Promise<IPayment[]>;
  findByStatus(status: PaymentStatus): Promise<IPayment[]>;
  findByPaymentNo(paymentNo: string): Promise<IPayment | null>;
  findByTransactionId(transactionId: string): Promise<IPayment | null>;
}

// 创建模型
const Payment: IPaymentModel = mongoose.model<IPayment, IPaymentModel>(
  "Payment",
  paymentSchema
);

export default Payment;
