import { LoginRequestBody, RegisterRequestBody } from "../utils/do/auth";
import { ErrorFactory } from "../utils/errors/custom-errors";
import * as bcrypt from "bcrypt";
import Account from "../model/mongo/account";

class AuthService {
  async login(body: LoginRequestBody) {
    try {
      // 直接使用 Mongoose 模型查找用户
      const user = await Account.findOne({
        $or: [{ username: body.username }, { email: body.username }]
      });

      if (!user)
        throw ErrorFactory.business("用户不存在", "USER_NOT_FOUND", 404);

      // 验证密码
      const isValidPassword = await bcrypt.compare(
        body.password,
        user.password
      );
      if (!isValidPassword)
        throw ErrorFactory.business("密码错误", "INVALID_PASSWORD", 401);

      // 更新最后登录时间
      await Account.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date()
      });

      // 返回格式匹配 schema 定义
      return {
        username: user.username,
        password: user.password,
        email: user.email
      };
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  async register(body: RegisterRequestBody) {
    try {
      // 检查用户是否已存在
      const existingUser = await Account.findOne({
        $or: [{ username: body.username }, { email: body.email }]
      });

      if (existingUser) {
        throw ErrorFactory.business("用户名或邮箱已存在", "USER_EXISTS", 409);
      }

      // 直接使用 Mongoose 模型创建用户
      const account = await Account.create(body);

      // 返回格式匹配 schema 定义
      return {
        username: account.username,
        password: account.password,
        email: account.email
      };
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }

  // 示例：使用 Mongoose 模型
  async getUserById(id: string) {
    try {
      const user = await Account.findById(id);

      if (!user) {
        throw ErrorFactory.business("用户不存在", "USER_NOT_FOUND", 404);
      }

      return {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      };
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  }
}

// 导出工厂函数，需要传入 fastify 实例
export default new AuthService();
