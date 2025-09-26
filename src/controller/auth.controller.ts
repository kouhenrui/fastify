import { FastifyReply, FastifyRequest } from "fastify";
import { LoginRequestBody, RegisterRequestBody } from "../utils/do/auth";
import authService from "../service/auth.service";
import { ErrorFactory } from "../utils/errors/custom-errors";
import t from "../utils/i18n";

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
      return reply.success(result, t("auth.login.success", undefined, request.lang));
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
      return reply.success(result, t("auth.register.success", undefined, request.lang));
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  };

  /**
   * 获取用户列表
   */
  getUserList = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const query = request.query as any;
      const result = await authService.getUserList(query);
      return reply.success(result, t("auth.user.list.success", undefined, request.lang));
    } catch (error: any) {
      throw ErrorFactory.business(error.message, error.code, error.details);
    }
  };

  /**
   * 获取角色列表
   */
  getRoleList = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const result = await authService.getAllRoles(request.query as any);
    return reply.success(result, t("auth.role.list.success", undefined, request.lang));
  };
  getRole = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const result = await authService.getRole(request.params.id);
    return reply.success(result, t("auth.role.get.success", undefined, request.lang));
  };
  resetPassword = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const { user } = request;
    if (!user?.id)
      throw ErrorFactory.business("用户ID不存在", "USER_ID_MISSING");

    const result = await authService.resetPassword(user.id);
    return reply.success(result, t("auth.reset_password.success", undefined, request.lang));
  };
}

export default new AuthController();
