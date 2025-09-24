import mongoose, { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import { IBaseModel, createSchema } from ".";
// 账户接口
export interface IAccount extends IBaseModel {
  username: string; // 用户名
  accessToken?: string; // 访问令牌
  email: string; // 邮箱
  password: string; // 密码
  avatar?: string; // 头像
  department?: string; // 部门
  level?: number; // 用户级别
  location?: string; // 地理位置
  roles: string[]; // 角色数组
  lastLoginAt?: Date; // 最后登录时间

  validatePassword(password: string): Promise<boolean>;
  updateLastLogin(accessToken: string): Promise<IAccount>;
  addRole(roleCode: string): Promise<IAccount>;
  removeRole(roleCode: string): Promise<IAccount>;
  hasRole(roleCode: string): boolean;
  toSafeObject(): any;
}

// 账户 Schema
const accountSchema = createSchema<IAccount>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
      index: true
    },
    accessToken: {
      type: String,
      default: null
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
    department: {
      type: String,
      default: null
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 100
    },
    location: {
      type: String,
      default: null
    },
    roles: {
      type: [String],
      default: []
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  "accounts"
);

// 添加基础索引（异步创建，避免阻塞）
// accountSchema.index({ isActive: 1, deletedAt: 1 }, { background: true });
// accountSchema.index({ createdAt: -1 }, { background: true });
// accountSchema.index({ updatedAt: -1 }, { background: true });

// // Account 特定索引（异步创建，避免阻塞）
// accountSchema.index({ username: 1, email: 1 }, { background: true });
// accountSchema.index({ roles: 1 }, { background: true });
// accountSchema.index({ department: 1 }, { background: true });
// accountSchema.index({ level: 1 }, { background: true });

// 添加基础虚拟字段
accountSchema.virtual("isDeleted").get(function (this: any) {
  return this.deletedAt !== null;
});

// 实例方法
accountSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

accountSchema.methods.updateLastLogin = function (accessToken: string) {
  this.accessToken = accessToken;
  this.lastLoginAt = new Date();
  return this.save();
};

accountSchema.methods.validatePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

accountSchema.methods.addRole = function (roleCode: string) {
  if (!this.roles.includes(roleCode)) {
    this.roles.push(roleCode);
  }
  return this.save();
};

accountSchema.methods.removeRole = function (roleCode: string) {
  this.roles = this.roles.filter((role: string) => role !== roleCode);
  return this.save();
};

accountSchema.methods.hasRole = function (roleCode: string) {
  return this.roles.includes(roleCode);
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

accountSchema.statics.findByRole = function (roleCode: string) {
  return this.find({ roles: roleCode, isActive: true, deletedAt: null });
};

accountSchema.statics.findByDepartment = function (department: string) {
  return this.find({ department, isActive: true, deletedAt: null });
};

// 中间件
accountSchema.pre("save", async function (next) {
  // 确保邮箱是小写
  if (this.email) {
    this.email = this.email.toLowerCase();
  }

  // 只有在密码被修改且未加密时才加密
  if (this.isModified("password") && !this.password.startsWith("$2b$")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = new Date();
  next();
});

// 静态方法接口
interface IAccountModel extends Model<IAccount> {
  findActiveUsers(): Promise<IAccount[]>;
  findByEmail(email: string): Promise<IAccount | null>;
  findByUsername(username: string): Promise<IAccount | null>;
  findByRole(roleCode: string): Promise<IAccount[]>;
  findByDepartment(department: string): Promise<IAccount[]>;
}

// 创建模型
const Account: IAccountModel = mongoose.model<IAccount, IAccountModel>(
  "Account",
  accountSchema
);

export default Account;
