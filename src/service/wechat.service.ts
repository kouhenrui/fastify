import { ErrorFactory } from "../utils/errors/custom-errors";
import Account from "../model/mongo/account";
import AccountProfile from "../model/mongo/accountProfile";
import { generateUUID } from "../utils/crypto/crypto";
import { TokenPayload, sign } from "../utils/token";
import RedisService from "../utils/redis";
import { KEY } from "../config/key";
import logger from "../config/logger/logger";
import * as crypto from "crypto";

interface WechatAccessTokenResponse {
  access_token: string;
  expires_in: number;
  openid: string;
  unionid?: string;
  session_key?: string;
}

interface WechatUserInfo {
  nickName: string;
  avatarUrl: string;
  gender: number;
  country: string;
  province: string;
  city: string;
  language: string;
}

interface _WechatPhoneResponse {
  phoneNumber: string;
  purePhoneNumber: string;
  countryCode: string;
}

export interface WechatLoginRequest {
  code: string;
  userInfo?: WechatUserInfo;
  encryptedData?: string;
  iv?: string;
  rawData?: string;
  signature?: string;
}

export interface WechatLoginResponse {
  token: string;
  expiresAt: number;
  user: {
    id: string;
    username: string;
    phone: string;
    userType: string;
    isVerified: boolean;
    avatar?: string;
    wechatInfo?: {
      openId: string;
      unionId?: string;
    };
  };
}

class WechatService {
  private redisService: typeof RedisService;
  private appId: string;
  private appSecret: string;
  private readonly WECHAT_API_BASE = "https://api.weixin.qq.com";
  private readonly REQUEST_TIMEOUT = 10000; // 10秒超时

  constructor() {
    this.redisService = RedisService;
    // 从环境变量获取微信小程序配置
    this.appId = process.env.WECHAT_APP_ID || "";
    this.appSecret = process.env.WECHAT_APP_SECRET || "";

    if (!this.appId || !this.appSecret) {
      logger.warn(
        "微信小程序配置不完整，请检查环境变量 WECHAT_APP_ID 和 WECHAT_APP_SECRET"
      );
    }
  }

  /**
   * 通过code获取微信session_key和openid
   */
  private async getWechatSession(
    code: string
  ): Promise<WechatAccessTokenResponse> {
    try {
      if (!this.appId || !this.appSecret) {
        throw ErrorFactory.business("微信小程序配置不完整");
      }

      const url = `${this.WECHAT_API_BASE}/sns/jscode2session?appid=${this.appId}&secret=${this.appSecret}&js_code=${code}&grant_type=authorization_code`;

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.REQUEST_TIMEOUT
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw ErrorFactory.business(
          `微信API请求失败: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();

      if (responseData.errcode) {
        logger.error("微信API错误:", responseData);
        throw ErrorFactory.business(
          `微信登录失败: ${responseData.errmsg} (${responseData.errcode})`
        );
      }

      logger.info("微信session获取成功", { openid: responseData.openid });
      return responseData;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw ErrorFactory.business("微信API请求超时");
      }
      logger.error("获取微信session失败:", error);
      throw ErrorFactory.business(`获取微信session失败: ${error.message}`);
    }
  }

  /**
   * 解密微信数据（手机号、用户信息等）
   */
  private decryptWechatData(
    encryptedData: string,
    iv: string,
    sessionKey: string
  ): any {
    try {
      const sessionKeyBuffer = Buffer.from(sessionKey, "base64");
      const encryptedDataBuffer = Buffer.from(encryptedData, "base64");
      const ivBuffer = Buffer.from(iv, "base64");

      const decipher = crypto.createDecipheriv(
        "aes-128-cbc",
        sessionKeyBuffer,
        ivBuffer
      );
      decipher.setAutoPadding(true);

      let decrypted = decipher.update(encryptedDataBuffer, undefined, "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error: any) {
      logger.error("微信数据解密失败:", error);
      throw ErrorFactory.business(`数据解密失败: ${error.message}`);
    }
  }

  /**
   * 验证微信数据签名
   */
  private verifyWechatSignature(
    rawData: string,
    signature: string,
    sessionKey: string
  ): boolean {
    try {
      const crypto = require("crypto");
      const hash = crypto.createHash("sha1");
      hash.update(rawData + sessionKey);
      const calculatedSignature = hash.digest("hex");

      return calculatedSignature === signature;
    } catch (error: any) {
      logger.error("微信签名验证失败:", error);
      return false;
    }
  }

  /**
   * 微信登录
   */
  async wechatLogin(request: WechatLoginRequest): Promise<WechatLoginResponse> {
    try {
      // 1. 获取微信session信息
      const wechatData = await this.getWechatSession(request.code);
      const { openid, unionid, session_key } = wechatData;

      if (!session_key || !openid || !unionid)
        throw ErrorFactory.business("微信登录失败");

      // 2. 验证数据签名（如果提供了rawData和signature）
      if (request.rawData && request.signature) {
        const isValidSignature = this.verifyWechatSignature(
          request.rawData,
          request.signature,
          session_key
        );
        if (!isValidSignature) throw ErrorFactory.business("数据签名验证失败");
      }

      // 3. 查找或创建用户
      let userProfile = await AccountProfile.findByWechatOpenId(openid);
      let user: any;

      if (!userProfile) {
        // 创建新用户账户
        const username = `wx_${openid.slice(-8)}`;
        user = await Account.create({
          username,
          email: `${openid}@wechat.local`,
          password: generateUUID(),
          userType: "customer",
          isActive: true
        });

        // 创建用户信息
        userProfile = await AccountProfile.create({
          accountId: user.id,
          wechatOpenId: openid,
          wechatUnionId: unionid
        });

        logger.info("创建新用户", { userId: user.id, openid });
      } else {
        // 获取关联的账户信息
        user = await Account.findById(userProfile.accountId);
        if (!user) {
          throw ErrorFactory.business("关联的账户不存在");
        }
      }

      // 4. 处理手机号授权
      let phoneNumber: string | undefined;
      if (request.encryptedData && request.iv) {
        try {
          const phoneData = this.decryptWechatData(
            request.encryptedData,
            request.iv,
            session_key
          );
          phoneNumber = phoneData.phoneNumber;

          // 更新用户手机号
          if (phoneNumber) {
            user.phone = phoneNumber;
            await user.save();
            logger.info("更新用户手机号", {
              userId: user.id,
              phone: phoneNumber
            });
          }
        } catch (error) {
          logger.warn("手机号解密失败:", error);
        }
      }

      // 5. 生成JWT token
      const accessToken = generateUUID();
      const payload: TokenPayload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.roles
      };
      const { token, expiresAt } = sign(payload);

      // 6. 更新用户登录信息
      await user.updateLastLogin(accessToken);
      await this.redisService.set(
        accessToken,
        { token, expiresAt },
        KEY.expiresIn
      );

      logger.info("微信登录成功", { userId: user.id, openid });
      const userInfo = {
        id: user.id,
        username: user.username,
        phone: user.phone,
        userType: user.userType,
        isVerified: userProfile.isVerified || false,
        avatar: userProfile.avatar || "",
        wechatInfo: {
          openId: openid,
          unionId: unionid
        }
      };
      return {
        token,
        expiresAt,
        user: userInfo
      };
    } catch (error: any) {
      logger.error("微信登录失败:", error);
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 商家登录
   */
  async merchantLogin(
    phone: string,
    password: string
  ): Promise<{
    token: string;
    expiresAt: number;
    user: {
      id: string;
      username: string;
      phone: string;
      userType: string;
    };
  }> {
    try {
      // 查找商家用户
      const user = await Account.findByPhone(phone);

      if (!user) {
        throw ErrorFactory.business("商家账户不存在");
      }

      if (user.userType !== "merchant") {
        throw ErrorFactory.business("该账户不是商家账户");
      }

      if (!user.isActive) {
        throw ErrorFactory.business("账户已被禁用");
      }

      // 验证密码
      if (!(await user.validatePassword(password))) {
        throw ErrorFactory.business("密码错误");
      }

      // 检查accessToken是否存在且有效
      if (
        user.accessToken &&
        (await this.redisService.exists(user.accessToken))
      ) {
        const tokenCache = await this.redisService.get(user.accessToken);
        return {
          token: tokenCache.token,
          expiresAt: tokenCache.expiresAt,
          user: {
            id: user.id,
            username: user.username,
            phone: user.phone || "",
            userType: user.userType
          }
        };
      } else {
        const accessToken = generateUUID();
        const payload: TokenPayload = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.roles
        };
        const { token, expiresAt } = sign(payload);

        await user.updateLastLogin(accessToken);
        await this.redisService.set(
          accessToken,
          { token, expiresAt },
          KEY.expiresIn
        );

        return {
          token,
          expiresAt,
          user: {
            id: user.id,
            username: user.username,
            phone: user.phone || "",
            userType: user.userType
          }
        };
      }
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 绑定微信到现有账户
   */
  async bindWechatToAccount(
    accountId: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 获取微信session信息
      const wechatData = await this.getWechatSession(code);
      const { openid, unionid } = wechatData;

      // 检查是否已经绑定
      const existingProfile = await AccountProfile.findByWechatOpenId(openid);
      if (existingProfile) {
        throw ErrorFactory.business("该微信账号已绑定其他账户");
      }

      // 检查账户是否存在
      const account = await Account.findById(accountId);
      if (!account) {
        throw ErrorFactory.business("账户不存在");
      }

      // 检查是否已有微信绑定
      const existingWechatProfile =
        await AccountProfile.findByAccountId(accountId);
      if (existingWechatProfile?.wechatOpenId) {
        throw ErrorFactory.business("该账户已绑定微信");
      }

      // 创建或更新用户信息
      if (existingWechatProfile) {
        existingWechatProfile.wechatOpenId = openid;
        if (unionid) {
          existingWechatProfile.wechatUnionId = unionid;
        }
        await existingWechatProfile.save();
      } else {
        const createData: any = {
          accountId,
          wechatOpenId: openid
        };
        if (unionid) {
          createData.wechatUnionId = unionid;
        }
        await AccountProfile.create(createData);
      }

      logger.info("微信绑定成功", { accountId, openid });
      return { success: true, message: "微信绑定成功" };
    } catch (error: any) {
      logger.error("微信绑定失败:", error);
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 解绑微信
   */
  async unbindWechat(
    accountId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userProfile = await AccountProfile.findByAccountId(accountId);
      if (!userProfile) {
        throw ErrorFactory.business("用户信息不存在");
      }

      if (!userProfile.wechatOpenId) {
        throw ErrorFactory.business("该账户未绑定微信");
      }

      // 清除微信信息
      delete userProfile.wechatOpenId;
      delete userProfile.wechatUnionId;
      await userProfile.save();

      logger.info("微信解绑成功", { accountId });
      return { success: true, message: "微信解绑成功" };
    } catch (error: any) {
      logger.error("微信解绑失败:", error);
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  /**
   * 验证微信配置
   */
  async validateWechatConfig(): Promise<{ valid: boolean; message: string }> {
    try {
      if (!this.appId || !this.appSecret) {
        return { valid: false, message: "微信小程序配置不完整" };
      }

      // 可以添加一个简单的API调用来验证配置
      // 这里只是检查配置是否存在
      return { valid: true, message: "微信小程序配置正常" };
    } catch (error: any) {
      return { valid: false, message: `配置验证失败: ${error.message}` };
    }
  }

  /**
   * 获取微信登录统计
   */
  async getWechatLoginStats(): Promise<{
    totalUsers: number;
    wechatUsers: number;
    todayLogins: number;
  }> {
    try {
      const [totalUsers, wechatUsers, todayLogins] = await Promise.all([
        Account.countDocuments({ userType: "customer", deletedAt: null }),
        AccountProfile.countDocuments({
          wechatOpenId: { $exists: true },
          deletedAt: null
        }),
        Account.countDocuments({
          userType: "customer",
          lastLoginAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          deletedAt: null
        })
      ]);

      return {
        totalUsers,
        wechatUsers,
        todayLogins
      };
    } catch (error: any) {
      logger.error("获取微信登录统计失败:", error);
      throw ErrorFactory.business(`获取统计信息失败: ${error.message}`);
    }
  }
}

export default new WechatService();
