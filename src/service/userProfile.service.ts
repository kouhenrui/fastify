import { ErrorFactory } from "../utils/errors/custom-errors";
import UserProfile, { IUserProfile } from "../model/mongo/accountProfile";
import Account from "../model/mongo/account";

interface UpdateUserProfileRequest {
  realName?: string;
  idCard?: string;
  address?: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: Date;
  emergencyContact?: string;
  emergencyPhone?: string;
  preferences?: {
    language?: string;
    notifications?: boolean;
    marketing?: boolean;
  };
}

interface CreateUserProfileRequest {
  accountId: string;
  wechatOpenId?: string;
  wechatUnionId?: string;
  realName?: string;
  idCard?: string;
  addresses?: Array<{
    type: 'home' | 'work' | 'other';
    name: string;
    address: string;
    isDefault?: boolean;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }>;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: Date;
  emergencyContact?: string;
  emergencyPhone?: string;
}

class UserProfileService {
  /**
   * 创建用户信息
   */
  async createUserProfile(data: CreateUserProfileRequest): Promise<IUserProfile> {
    try {
      // 检查账户是否存在
      const account = await Account.findById(data.accountId);
      if (!account) {
        throw ErrorFactory.business("关联的账户不存在");
      }

      // 检查是否已存在用户信息
      const existingProfile = await UserProfile.findByAccountId(data.accountId);
      if (existingProfile) {
        throw ErrorFactory.business("用户信息已存在");
      }

      const userProfile = await UserProfile.create(data);
      return userProfile;
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 根据账户ID获取用户信息
   */
  async getUserProfileByAccountId(accountId: string): Promise<IUserProfile | null> {
    try {
      return await UserProfile.findByAccountId(accountId);
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 根据微信OpenID获取用户信息
   */
  async getUserProfileByWechatOpenId(openId: string): Promise<IUserProfile | null> {
    try {
      return await UserProfile.findByWechatOpenId(openId);
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 更新用户信息
   */
  async updateUserProfile(accountId: string, data: UpdateUserProfileRequest): Promise<IUserProfile | null> {
    try {
      const userProfile = await UserProfile.findByAccountId(accountId);
      if (!userProfile) {
        throw ErrorFactory.business("用户信息不存在");
      }

      // 更新字段
      Object.keys(data).forEach(key => {
        if (data[key as keyof UpdateUserProfileRequest] !== undefined) {
          (userProfile as any)[key] = data[key as keyof UpdateUserProfileRequest];
        }
      });

      await userProfile.save();
      return userProfile;
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 验证用户身份
   */
  async verifyUser(accountId: string, verificationData: {
    realName: string;
    idCard: string;
  }): Promise<IUserProfile | null> {
    try {
      const userProfile = await UserProfile.findByAccountId(accountId);
      if (!userProfile) {
        throw ErrorFactory.business("用户信息不存在");
      }

      // 更新验证信息
      userProfile.realName = verificationData.realName;
      userProfile.idCard = verificationData.idCard;
      userProfile.isVerified = true;

      await userProfile.save();
      return userProfile;
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 获取已验证用户列表
   */
  async getVerifiedUsers(): Promise<IUserProfile[]> {
    try {
      return await UserProfile.findVerifiedUsers();
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 删除用户信息
   */
  async deleteUserProfile(accountId: string): Promise<boolean> {
    try {
      const userProfile = await UserProfile.findByAccountId(accountId);
      if (!userProfile) {
        throw ErrorFactory.business("用户信息不存在");
      }

      await userProfile.softDelete();
      return true;
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 获取用户完整信息（包含账户信息）
   */
  async getUserFullProfile(accountId: string): Promise<{
    account: any;
    profile: IUserProfile | null;
  }> {
    try {
      const [account, profile] = await Promise.all([
        Account.findById(accountId),
        UserProfile.findByAccountId(accountId)
      ]);

      if (!account) {
        throw ErrorFactory.business("账户不存在");
      }

      return {
        account: account.toSafeObject(),
        profile
      };
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 添加地址
   */
  async addAddress(accountId: string, addressData: {
    type: 'home' | 'work' | 'other';
    name: string;
    address: string;
    isDefault?: boolean;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }): Promise<IUserProfile | null> {
    try {
      const userProfile = await UserProfile.findByAccountId(accountId);
      if (!userProfile) {
        throw ErrorFactory.business("用户信息不存在");
      }

      // 如果设置为默认地址，先取消其他地址的默认状态
      if (addressData.isDefault) {
        userProfile.addresses?.forEach(addr => {
          addr.isDefault = false;
        });
      }

      // 添加新地址
      if (!userProfile.addresses) {
        userProfile.addresses = [];
      }
      userProfile.addresses.push(addressData);

      await userProfile.save();
      return userProfile;
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 更新地址
   */
  async updateAddress(accountId: string, addressIndex: number, addressData: {
    type?: 'home' | 'work' | 'other';
    name?: string;
    address?: string;
    isDefault?: boolean;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }): Promise<IUserProfile | null> {
    try {
      const userProfile = await UserProfile.findByAccountId(accountId);
      if (!userProfile) {
        throw ErrorFactory.business("用户信息不存在");
      }

      if (!userProfile.addresses || addressIndex >= userProfile.addresses.length) {
        throw ErrorFactory.business("地址不存在");
      }

      // 如果设置为默认地址，先取消其他地址的默认状态
      if (addressData.isDefault) {
        userProfile.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }

      // 更新地址
      Object.keys(addressData).forEach(key => {
        if (addressData[key as keyof typeof addressData] !== undefined) {
          (userProfile.addresses![addressIndex] as any)[key] = addressData[key as keyof typeof addressData];
        }
      });

      await userProfile.save();
      return userProfile;
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 删除地址
   */
  async removeAddress(accountId: string, addressIndex: number): Promise<IUserProfile | null> {
    try {
      const userProfile = await UserProfile.findByAccountId(accountId);
      if (!userProfile) {
        throw ErrorFactory.business("用户信息不存在");
      }

      if (!userProfile.addresses || addressIndex >= userProfile.addresses.length) {
        throw ErrorFactory.business("地址不存在");
      }

      userProfile.addresses.splice(addressIndex, 1);
      await userProfile.save();
      return userProfile;
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 设置默认地址
   */
  async setDefaultAddress(accountId: string, addressIndex: number): Promise<IUserProfile | null> {
    try {
      const userProfile = await UserProfile.findByAccountId(accountId);
      if (!userProfile) {
        throw ErrorFactory.business("用户信息不存在");
      }

      if (!userProfile.addresses || addressIndex >= userProfile.addresses.length) {
        throw ErrorFactory.business("地址不存在");
      }

      // 取消所有地址的默认状态
      userProfile.addresses.forEach(addr => {
        addr.isDefault = false;
      });

      // 设置指定地址为默认
      userProfile.addresses[addressIndex].isDefault = true;

      await userProfile.save();
      return userProfile;
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }
}

export default new UserProfileService();
