import mongoose, { Model } from "mongoose";
import { IBaseModel, createSchema } from ".";
import { Address } from "./common";

// 用户信息接口
export interface IAccountProfile extends IBaseModel {
  accountId: string; // 关联的账户ID
  wechatOpenId?: string; // 微信OpenID
  wechatUnionId?: string; // 微信UnionID
  realName?: string; // 真实姓名
  idCard?: string; // 身份证号
  addresses?: Array<Address>; // 地址列表
  isVerified?: boolean; // 是否已认证
  avatar?: string; // 头像
  gender?: "male" | "female" | "other"; // 性别
  birthday?: Date; // 生日
  emergencyContact?: string; // 紧急联系人
  emergencyPhone?: string; // 紧急联系人电话
  preferences?: {
    language?: string; // 语言偏好
    notifications?: boolean; // 是否接收通知
    marketing?: boolean; // 是否接收营销信息
  };
}

// 用户信息 Schema
const userProfileSchema = createSchema<IAccountProfile>(
  {
    accountId: {
      type: String,
      required: true,
      ref: "Account",
      index: true
    },
    wechatOpenId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    wechatUnionId: {
      type: String,
      index: true
    },
    realName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    idCard: {
      type: String,
      trim: true,
      match: [
        /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
        "请输入有效的身份证号"
      ]
    },
    addresses: [
      {
        code: {
          type: String,
          required: true,
          unique: true
        },
        type: {
          type: String,
          enum: ["home", "work", "other"],
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
        isDefault: {
          type: Boolean,
          default: false
        },
        contactName: {
          type: String,
          trim: true,
          maxlength: 50
        },
        contactPhone: {
          type: String,
          trim: true,
          maxlength: 50
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
        }
      }
    ],
    isVerified: {
      type: Boolean,
      default: false
    },
    avatar: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },
    birthday: {
      type: Date
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: 50
    },
    emergencyPhone: {
      type: String,
      trim: true,
      match: [/^1[3-9]\d{9}$/, "请输入有效的手机号"]
    },
    preferences: {
      language: {
        type: String,
        default: "zh-CN"
      },
      notifications: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    }
  },
  "account_profiles"
);

// 实例方法
userProfileSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.idCard; // 敏感信息不返回
  return obj;
};

// 静态方法
userProfileSchema.statics.findByAccountId = function (accountId: string) {
  return this.findOne({ accountId, deletedAt: null });
};

userProfileSchema.statics.findByWechatOpenId = function (openId: string) {
  return this.findOne({ wechatOpenId: openId, deletedAt: null });
};

userProfileSchema.statics.findByWechatUnionId = function (unionId: string) {
  return this.find({ wechatUnionId: unionId, deletedAt: null });
};

userProfileSchema.statics.findVerifiedUsers = function () {
  return this.find({ isVerified: true, deletedAt: null });
};

// 静态方法接口
interface IAccountProfileModel extends Model<IAccountProfile> {
  findByAccountId(accountId: string): Promise<IAccountProfile | null>;
  findByWechatOpenId(openId: string): Promise<IAccountProfile | null>;
  findByWechatUnionId(unionId: string): Promise<IAccountProfile[]>;
  findVerifiedUsers(): Promise<IAccountProfile[]>;
}

// 创建模型
const UserProfile: IAccountProfileModel = mongoose.model<
  IAccountProfile,
  IAccountProfileModel
>("UserProfile", userProfileSchema);

export default UserProfile;
