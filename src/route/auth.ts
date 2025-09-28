import { FastifyInstance } from "fastify";
import {
  authResponseSchema,
  loginRequestSchema,
  merchantLoginRequestSchema,
  registerRequestSchema,
  userListQuerySchema,
  userListResponseSchema,
  wechatLoginRequestSchema,
  wechatLoginResponseSchema
} from "../schemas";
import authController from "../controller/auth.controller";

export default async function authRoutes(auth: FastifyInstance) {
  // 登录
  auth.post(
    "/login",
    {
      schema: {
        tags: ["认证"],
        summary: "用户登录",
        description: "通过用户名/邮箱和密码进行用户登录",
        body: loginRequestSchema
      }
    },
    authController.login
  );

  // 用户注册
  auth.post(
    "/register",
    {
      schema: {
        tags: ["认证"],
        summary: "用户注册",
        description: "创建新用户账户",
        body: registerRequestSchema,
        response: {
          200: authResponseSchema
        }
      }
    },
    authController.register
  );

  // 获取用户列表
  auth.get(
    "/users",
    {
      schema: {
        tags: ["认证"],
        summary: "获取用户列表",
        description: "分页获取用户列表，支持搜索、排序和过滤",
        querystring: userListQuerySchema,
        response: {
          200: userListResponseSchema
        }
      }
    },
    authController.getUserList
  );

  auth.get(
    "/role/list",
    {
      schema: {
        tags: ["认证"],
        summary: "获取角色列表",
        description: "获取角色列表"
      }
    },
    authController.getRoleList
  );
  auth.get('/reset/password', {
    schema: {
      tags: ["认证"],
      summary: "重置密码",
      description: "重置密码"
    }
  }, authController.resetPassword);

  // 微信登录
  auth.post(
    "/wechat/login",
    {
      schema: {
        tags: ["认证"],
        summary: "微信登录",
        description: "通过微信授权码进行登录，支持手机号授权",
        body: wechatLoginRequestSchema,
        response: {
          200: wechatLoginResponseSchema
        }
      }
    },
    authController.wechatLogin
  );

  // 商家登录
  auth.post(
    "/merchant/login",
    {
      schema: {
        tags: ["认证"],
        summary: "商家登录",
        description: "商家通过手机号和密码登录",
        body: merchantLoginRequestSchema,
        response: {
          200: wechatLoginResponseSchema
        }
      }
    },
    authController.merchantLogin
  );
}
