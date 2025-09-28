import mongoose, { Model } from "mongoose";
import { IBaseModel, createSchema } from ".";

// 订单历史记录接口
export interface IOrderHistory extends IBaseModel {
  orderId: string; // 订单ID
  orderNo: string; // 订单号
  action: string; // 操作类型
  description: string; // 操作描述
  operatorId: string; // 操作人ID
  operatorType: 'customer' | 'merchant' | 'system' | 'admin'; // 操作人类型
  operatorName: string; // 操作人姓名
  previousStatus?: string; // 之前状态
  currentStatus?: string; // 当前状态
  metadata?: any; // 附加数据
  timestamp: Date; // 操作时间
}

// 订单历史记录 Schema
const orderHistorySchema = createSchema<IOrderHistory>(
  {
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
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    operatorId: {
      type: String,
      required: true,
      ref: 'Account',
      index: true
    },
    operatorType: {
      type: String,
      required: true,
      enum: ['customer', 'merchant', 'system', 'admin'],
      index: true
    },
    operatorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    previousStatus: {
      type: String,
      trim: true
    },
    currentStatus: {
      type: String,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    }
  },
  "order_histories"
);

// 静态方法
orderHistorySchema.statics.findByOrderId = function (orderId: string) {
  return this.find({ orderId, deletedAt: null }).sort({ timestamp: -1 });
};

orderHistorySchema.statics.findByOrderNo = function (orderNo: string) {
  return this.find({ orderNo, deletedAt: null }).sort({ timestamp: -1 });
};

orderHistorySchema.statics.findByOperator = function (operatorId: string) {
  return this.find({ operatorId, deletedAt: null }).sort({ timestamp: -1 });
};

orderHistorySchema.statics.findByAction = function (action: string) {
  return this.find({ action, deletedAt: null }).sort({ timestamp: -1 });
};

// 静态方法接口
interface IOrderHistoryModel extends Model<IOrderHistory> {
  findByOrderId(orderId: string): Promise<IOrderHistory[]>;
  findByOrderNo(orderNo: string): Promise<IOrderHistory[]>;
  findByOperator(operatorId: string): Promise<IOrderHistory[]>;
  findByAction(action: string): Promise<IOrderHistory[]>;
}

// 创建模型
const OrderHistory: IOrderHistoryModel = mongoose.model<IOrderHistory, IOrderHistoryModel>(
  "OrderHistory",
  orderHistorySchema
);

export default OrderHistory;
