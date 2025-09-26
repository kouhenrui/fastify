import { FastifyInstance } from "fastify";
import {
  authResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  userListQuerySchema,
  userListResponseSchema
} from "../schemas";
import authController from "../controller/auth.controller";

export default async function authRoutes(auth: FastifyInstance) {
  // 用户登录
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
}
