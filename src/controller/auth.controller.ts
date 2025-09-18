import { FastifyReply, FastifyRequest } from "fastify";
import { LoginRequestBody, RegisterRequestBody } from "../utils/do/auth";
import authService from "../service/auth.service";
import { ErrorFactory } from "../utils/errors/custom-errors";

class AuthController {

  /**
   * 用户登录
   * @param {LoginRequestBody} body请求参数
   * @param {FastifyReply} reply响应
   * @returns
   */
  login = async (
    request: FastifyRequest<{ Body: LoginRequestBody }>,
    reply: FastifyReply
  ) => {
    try {
      const body = request.body;
      const result = await authService.login(body);
      return reply.success(result, "登录成功");
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  };

  /**
   * 用户注册
   */
  register = async (
    request: FastifyRequest<{ Body: RegisterRequestBody }>,
    reply: FastifyReply
  ) => {
    try {
      const body = request.body;
      const result = await authService.register(body);
      return reply.success(result, "注册成功");
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  };
}

// 导出工厂函数，需要传入 fastify 实例
export default new AuthController();
