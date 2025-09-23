/**
 * ABAC 初始化数据配置
 * 包含角色、资源和权限策略的初始数据
 */

export const ABAC_INIT_DATA = {
  // 角色数据
  roles: [
    {
      name: "超级管理员",
      code: "super",
      description: "系统超级管理员，拥有所有权限",
      level: 1
    },
    {
      name: "系统管理员",
      code: "system_admin",
      description: "系统管理员，管理用户和系统配置",
      level: 2
    },
    {
      name: "用户管理员",
      code: "user_admin",
      description: "用户管理员，管理用户账户",
      level: 3
    },
    {
      name: "内容管理员",
      code: "content_admin",
      description: "内容管理员，管理内容资源",
      level: 4
    },
    {
      name: "普通用户",
      code: "user",
      description: "普通用户，基础权限",
      level: 5
    },
    {
      name: "访客",
      code: "guest",
      description: "访客用户，只读权限",
      level: 6
    }
  ],

  // 资源数据
  resources: [
    // 用户管理资源
    {
      name: "用户管理",
      code: "user_management",
      description: "用户账户管理",
      type: "management",
      path: "/api/user",
      method: "GET"
    },
    {
      name: "用户列表",
      code: "user_list",
      description: "查看用户列表",
      type: "data",
      path: "/api/user",
      method: "GET"
    },
    {
      name: "用户详情",
      code: "user_detail",
      description: "查看用户详情",
      type: "data",
      path: "/api/user",
      method: "GET"
    },
    {
      name: "用户创建",
      code: "user_create",
      description: "创建新用户",
      type: "action",
      path: "/api/user",
      method: "POST"
    },
    {
      name: "用户编辑",
      code: "user_edit",
      description: "编辑用户信息",
      type: "action",
      path: "/api/user",
      method: "PUT"
    },
    {
      name: "用户删除",
      code: "user_delete",
      description: "删除用户",
      type: "action",
      path: "/api/user",
      method: "DELETE"
    },
    {
      name: "用户重置密码",
      code: "user_reset_password",
      description: "重置用户密码",
      type: "action",
      path: "/api/user",
      method: "PUT"
    },

    // 角色管理资源
    {
      name: "角色管理",
      code: "role_management",
      description: "角色权限管理",
      type: "management",
      path: "/api/role",
      method: "GET"
    },
    {
      name: "角色列表",
      code: "role_list",
      description: "查看角色列表",
      type: "data",
      path: "/api/role",
      method: "GET"
    },
    {
      name: "角色详情",
      code: "role_detail",
      description: "查看角色详情",
      type: "data",
      path: "/api/role",
      method: "GET"
    },
    {
      name: "角色创建",
      code: "role_create",
      description: "创建新角色",
      type: "action",
      path: "/api/role",
      method: "POST"
    },
    {
      name: "角色编辑",
      code: "role_edit",
      description: "编辑角色信息",
      type: "action",
      path: "/api/role",
      method: "PUT"
    },
    {
      name: "角色删除",
      code: "role_delete",
      description: "删除角色",
      type: "action",
      path: "/api/role",
      method: "DELETE"
    },

    // 资源管理
    {
      name: "资源管理",
      code: "resource_management",
      description: "资源权限管理",
      type: "management",
      path: "/api/resource",
      method: "GET"
    },
    {
      name: "资源列表",
      code: "resource_list",
      description: "查看资源列表",
      type: "data",
      path: "/api/resource",
      method: "GET"
    },
    {
      name: "资源创建",
      code: "resource_create",
      description: "创建新资源",
      type: "action",
      path: "/api/resource",
      method: "POST"
    },
    {
      name: "资源编辑",
      code: "resource_edit",
      description: "编辑资源信息",
      type: "action",
      path: "/api/resource",
      method: "PUT"
    },
    {
      name: "资源删除",
      code: "resource_delete",
      description: "删除资源",
      type: "action",
      path: "/api/resource",
      method: "DELETE"
    },

    // 系统管理资源
    {
      name: "系统管理",
      code: "system_management",
      description: "系统配置管理",
      type: "management",
      path: "/api/system",
      method: "GET"
    },
    {
      name: "系统配置",
      code: "system_config",
      description: "系统配置信息",
      type: "data",
      path: "/api/system",
      method: "GET"
    },
    {
      name: "系统日志",
      code: "system_log",
      description: "系统日志查看",
      type: "data",
      path: "/api/system",
      method: "GET"
    },
    {
      name: "系统监控",
      code: "system_monitor",
      description: "系统监控信息",
      type: "data",
      path: "/api/system",
      method: "GET"
    },

    // API 资源
    {
      name: "API 管理",
      code: "api_management",
      description: "API 接口管理",
      type: "management",
      path: "/api/api",
      method: "GET"
    },
    {
      name: "API 文档",
      code: "api_docs",
      description: "API 文档查看",
      type: "data",
      path: "/api/api",
      method: "GET"
    },
    {
      name: "API 测试",
      code: "api_test",
      description: "API 接口测试",
      type: "action",
      path: "/api/api",
      method: "GET"
    }
  ],

  // 权限策略数据
  policies: [
    // 超级管理员 - 拥有所有权限
    ["super_admin", "*", "*", "allow"],

    // 系统管理员权限
    ["system_admin", "user_management", "*", "*", "allow"],
    ["system_admin", "role_management", "*", "*", "allow"],
    ["system_admin", "resource_management", "*", "*", "allow"],
    ["system_admin", "system_management", "*", "*", "allow"],
    ["system_admin", "api_management", "*", "*", "allow"],
    ["system_admin", "system_log", "read", "*", "allow"],
    ["system_admin", "system_monitor", "read", "*", "allow"],

    // 用户管理员权限
    ["user_admin", "user_list", "read", "*", "allow"],
    ["user_admin", "user_detail", "read", "*", "allow"],
    ["user_admin", "user_create", "create", "*", "allow"],
    ["user_admin", "user_edit", "update", "*", "allow"],
    ["user_admin", "user_delete", "delete", "*", "allow"],
    ["user_admin", "user_reset_password", "update", "*", "allow"],
    ["user_admin", "role_list", "read", "*", "allow"],
    ["user_admin", "role_detail", "read", "*", "allow"],

    // 内容管理员权限
    ["content_admin", "user_list", "read", "*", "allow"],
    ["content_admin", "user_detail", "read", "*", "allow"],
    ["content_admin", "user_edit", "update", "*", "own"],
    ["content_admin", "system_log", "read", "*", "allow"],
    ["content_admin", "api_docs", "read", "*", "allow"],

    // 普通用户权限
    ["user", "user_detail", "read", "*", "own"],
    ["user", "user_edit", "update", "*", "own"],
    ["user", "api_docs", "read", "*", "allow"],
    ["user", "api_test", "execute", "*", "allow"],

    // 访客权限
    ["guest", "api_docs", "read", "*", "allow"],

    // 拒绝规则
    ["guest", "user_management", "*", "*", "deny"],
    ["guest", "role_management", "*", "*", "deny"],
    ["guest", "resource_management", "*", "*", "deny"],
    ["guest", "system_management", "*", "*", "deny"],
    ["user", "user_delete", "delete", "*", "deny"],
    ["user", "user_reset_password", "update", "*", "deny"]
  ],
  defaultPolicy: {
    sub: "super",
    obj: "*",
    act: "*",
    env: "*",
    eft: "*"
  },
  // 默认管理员用户
  defaultAdmin: {
    username: "admin",
    email: "admin@example.com",
    password: "admin123456",
    roles: ["super"]
  }
};

export default ABAC_INIT_DATA;
