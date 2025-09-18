import mongoose, { Document, Model, Schema } from "mongoose";

// 账户接口
export interface IAccount extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  deletedBy?: string;
}

// 账户 Schema
const accountSchema = new Schema<IAccount>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "请输入有效的邮箱地址"
      ],
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    avatar: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt
    collection: "accounts", // 指定集合名称
    versionKey: false // 禁用 __v 字段
  }
);

// 索引
accountSchema.index({ username: 1, email: 1 });
accountSchema.index({ isActive: 1, deletedAt: 1 });
accountSchema.index({ createdAt: -1 });

// 虚拟字段
accountSchema.virtual("isDeleted").get(function () {
  return this.deletedAt !== null;
});

// 实例方法
accountSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

accountSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

// 静态方法
accountSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true, deletedAt: null });
};

accountSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), deletedAt: null });
};

accountSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username, deletedAt: null });
};

accountSchema.statics.softDelete = function (id: string, deletedBy?: string) {
  return this.findByIdAndUpdate(id, {
    deletedAt: new Date(),
    deletedBy: deletedBy || "system"
  });
};

// 中间件
accountSchema.pre("save", function (next) {
  // 确保邮箱是小写
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

accountSchema.pre("find", function () {
  // 默认过滤已删除的记录
  this.where({ deletedAt: null });
});

accountSchema.pre("findOne", function () {
  // 默认过滤已删除的记录
  this.where({ deletedAt: null });
});

// 创建模型
const Account: Model<IAccount> = mongoose.model<IAccount>(
  "Account",
  accountSchema
);

export default Account;
