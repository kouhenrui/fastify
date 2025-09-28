import { LoginRequestBody, RegisterRequestBody } from "../utils/do/auth";
import { ErrorFactory } from "../utils/errors/custom-errors";
import Account, { IAccount } from "../model/mongo/account";
import AccountProfile from "../model/mongo/accountProfile";
import { generateUUID } from "../utils/crypto/crypto";
import { TokenPayload, sign } from "../utils/token";
import Role, { IRole } from "../model/mongo/role";
import Resource, { IResource } from "../model/mongo/resource";
import RedisService from "../utils/redis";
import { KEY } from "../config/key";
import WechatService, {
  WechatLoginRequest,
  WechatLoginResponse
} from "./wechat.service";
import { TimeUtil } from "../utils/time/time";
import { User } from "../utils/types/response";
import { Address } from "../model/mongo/common";
class AuthService {
  private redisService: typeof RedisService;
  private wechatService: typeof WechatService;
  constructor() {
    this.redisService = RedisService;
    this.wechatService = WechatService;
  }
  async login(
    body: LoginRequestBody
  ): Promise<{ token: string; expiresAt: number }> {
    try {
      const user = await Account.findOne({
        $or: [{ username: body.username }, { email: body.username }]
      });

      if (!user) throw ErrorFactory.business("auth.login.account_not_found");
      if (!user.validatePassword(body.password))
        throw ErrorFactory.business("auth.login.invalid_password");
      // 检查accessToken是否存在且有效
      if (
        user.accessToken &&
        (await this.redisService.exists(user.accessToken))
      ) {
        const tokenCache = await this.redisService.get(user.accessToken);
        return {
          token: tokenCache.token,
          expiresAt: tokenCache.expiresAt
        };
      } else {
        const accessToken = generateUUID();
        const payload: TokenPayload = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.roles
        };
        const { token, expiresAt } = sign(payload); // 更新最后登录时间
        await user.updateLastLogin(accessToken);
        await this.redisService.set(
          accessToken,
          { token, expiresAt },
          KEY.expiresIn
        );
        return {
          token,
          expiresAt
        };
      }
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 微信小程序登录和注册
   * @param body 注册请求体
   * @returns
   */
  async wechatLoginAndRegister(
    body: WechatLoginRequest
  ): Promise<WechatLoginResponse> {
    try {
      return await this.wechatService.wechatLogin(body);
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 完善用户信息
   */
  async completeUserInfo(body: {
    accountId: string;
    realName: string;
    idCard: string;
    password?: string;
  }): Promise<void> {
    try {
      const user = await Account.findById(body.accountId);
      if (!user)
        throw ErrorFactory.business(
          "auth.complete_user_info.account_not_found"
        );
      const userProfile = await AccountProfile.findByAccountId(body.accountId);
      if (!userProfile)
        throw ErrorFactory.business(
          "auth.complete_user_info.user_profile_not_found"
        );
      userProfile.realName = body.realName;
      if (body.idCard && body.idCard.length === 18) {
        const gender =
          Number(body.idCard.charAt(16)) % 2 === 0 ? "female" : "male";
        const birthday = body.idCard.substring(6, 14);
        userProfile.idCard = body.idCard;
        userProfile.gender = gender;
        userProfile.birthday = TimeUtil.parseDate(birthday);
        userProfile.isVerified = true;
      }
      if (body.password) user.password = body.password;
      await user.save();
      await userProfile.save();
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 获取用户地址
   */
  async getUserAddress(user: User): Promise<Address[]> {
    const userProfile = await AccountProfile.findByAccountId(user.id);
    if (!userProfile)
      throw ErrorFactory.business(
        "auth.get_user_address.user_profile_not_found"
      );
    return userProfile.addresses || [];
  }

  /**
   * 用户添加地址
   */
  async setUserAddress(
    address: {
      type: "home" | "work" | "other";
      name: string;
      address: string;
      isDefault?: boolean;
      contactName?: string;
      contactPhone?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    },
    user: User
  ): Promise<void> {
    try {
      const userProfile = await AccountProfile.findByAccountId(user.id);
      if (!userProfile)
        throw ErrorFactory.business(
          "auth.set_user_address.user_profile_not_found"
        );
      if (!userProfile.addresses) {
        userProfile.addresses = [];
      }
      if (
        address.isDefault &&
        userProfile.addresses &&
        userProfile.addresses.length > 0
      ) {
        userProfile.addresses.forEach((item: Address) => {
          item.isDefault = false;
        });
      }
      const newAddress: Address = { ...address, code: generateUUID() };
      userProfile.addresses.push(newAddress);
      await userProfile.save();
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 删除用户地址
   */
  async deleteUserAddress(code: string, user: User): Promise<void> {
    try {
      const userProfile = await AccountProfile.findByAccountId(user.id);
      if (!userProfile)
        throw ErrorFactory.business(
          "auth.delete_user_address.user_profile_not_found"
        );
      if (userProfile.addresses && userProfile.addresses.length > 0) {
        userProfile.addresses = userProfile.addresses.filter(
          (item: Address) => item.code !== code
        );
      }
      await userProfile.save();
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 编辑用户地址
   */
  async editUserAddress(
    address: {
      code: string;
      type?: "home" | "work" | "other";
      name?: string;
      address?: string;
      isDefault?: boolean;
      contactName?: string;
      contactPhone?: string;
      coordinates?: { latitude: number; longitude: number };
    },
    user: User
  ): Promise<void> {
    const userProfile = await AccountProfile.findByAccountId(user.id);
    if (!userProfile)
      throw ErrorFactory.business(
        "auth.edit_user_address.user_profile_not_found"
      );
    if (userProfile.addresses && userProfile.addresses.length > 0) {
      if (address.isDefault) {
        userProfile.addresses.forEach((item: Address) => {
          if (item.code !== address.code) item.isDefault = false;
        });
      }
      userProfile.addresses = userProfile.addresses.map((item: Address) => {
        if (item.code === address.code) {
          return { ...item, ...address };
        }
        return item;
      });
    }
    await userProfile.save();
  }
  /**
   * 商家注册
   * @param body 注册请求体
   * @returns
   */
  async merchantRegister(body: RegisterRequestBody): Promise<void> {
    try {
      // 检查用户是否已存在
      const existingUser = await Account.findByPhone(body.phone);

      if (existingUser)
        throw ErrorFactory.validation(
          `auth.register.username_or_email_already_exists`
        );
      // 直接使用 Mongoose 模型创建用户
      const newMerchant = { ...body, userType: "merchant" };
      const merchant = await Account.create(newMerchant);
      await AccountProfile.create({
        accountId: merchant.id,
        isVerified: false
      });
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }
  /**
   * 获取所有用户
   */
  async getAllUsers(): Promise<IAccount[]> {
    return await Account.find();
  }

  /**
   * 重置密码
   */
  async resetPassword(
    id: string,
    newPassword?: string
  ): Promise<{ message: string }> {
    try {
      const user = await Account.findById(id);
      if (!user)
        throw ErrorFactory.business("auth.reset_password.account_not_found");

      // 使用默认密码或提供的密码
      const password = newPassword || "123456";
      if (user.accessToken) {
        user.accessToken = "";
        if (await this.redisService.exists(user.accessToken))
          await this.redisService.del(user.accessToken);
      }
      // 直接修改密码字段，中间件会自动加密
      user.password = password;
      await user.save();

      return { message: "auth.reset_password.success" };
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  //---------------------------角色管理-----------------------------

  /**
   * 添加角色
   */
  async addRole(body: any): Promise<IRole> {
    try {
      const role = await Role.create(body);
      return role;
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 编辑角色
   */
  async editRole(id: string, body: any): Promise<IRole | null> {
    try {
      return await Role.findByIdAndUpdate(id, body);
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<IRole | null> {
    try {
      return await Role.softDelete(id);
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 获取角色
   */
  async getRole(id: string): Promise<IRole | null> {
    try {
      return await Role.findById(id);
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 获取所有角色
   */
  async getAllRoles(query: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: string;
  }): Promise<{
    role: IRole[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = "createdAt",
        order = "desc"
      } = query;
      const skip = (page - 1) * limit;
      const sortOrder = order === "asc" ? 1 : -1;
      const sortObj: any = {};
      sortObj[sort] = sortOrder;
      const role = await Role.findAll(skip, limit, sortObj);
      const total = await Role.countDocuments();
      const totalPages = Math.ceil(total / limit);
      return {
        role,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 增加资源
   */
  async addResource(body: any): Promise<IResource> {
    try {
      return await Resource.create(body);
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 编辑资源
   */
  async editResource(id: string, body: any): Promise<IResource | null> {
    try {
      return await Resource.findByIdAndUpdate(id, body);
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 删除资源
   */
  async deleteResource(id: string): Promise<IResource | null> {
    try {
      return await Resource.findByIdAndUpdate(id, {
        isActive: false
      });
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 获取资源
   */
  async getResource(id: string): Promise<IResource | null> {
    try {
      return await Resource.findById(id);
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 获取所有资源
   */
  async getAllResources(): Promise<IResource[]> {
    try {
      return await Resource.findAll();
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }

  /**
   * 获取用户列表
   */
  async getUserList(query: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: string;
    order?: string;
    role?: string;
  }) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sort = "createdAt",
        order = "desc",
        role
      } = query;

      // 构建查询条件
      const filter: any = {};
      if (search) {
        filter.$or = [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }

      if (role) {
        filter.roles = { $in: [role] };
      }

      // 构建排序条件
      const sortOrder = order === "asc" ? 1 : -1;
      const sortObj: any = {};
      sortObj[sort] = sortOrder;

      // 计算分页
      const skip = (page - 1) * limit;
      // 查询数据
      const [users, total] = await Promise.all([
        Account.find(filter)
          .select("-password") // 排除密码字段
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        Account.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error: any) {
      throw ErrorFactory.validation(error.message);
    }
  }
}

export default new AuthService();
