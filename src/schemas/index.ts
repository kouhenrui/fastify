// 通用响应 schema
export const successResponseSchema = {
  type: "object",
  properties: {
    code: { type: "number" },
    message: { type: "string" },
    data: { type: "object" },
    timestamp: { type: "number" },
    requestId: { type: "string" }
  },
  required: ["code", "message", "data", "timestamp"]
};

export const errorResponseSchema = {
  type: "object",
  properties: {
    code: { type: "number" },
    message: { type: "string" },
    error: { type: "string" },
    details: { type: "object" },
    timestamp: { type: "number" },
    requestId: { type: "string" }
  },
  required: ["code", "message", "error", "timestamp"]
};

// 用户列表查询参数 schema
export const userListQuerySchema = {
  type: "object",
  properties: {
    page: { 
      type: "number", 
      minimum: 1, 
      default: 1,
      description: "页码"
    },
    limit: { 
      type: "number", 
      minimum: 1, 
      maximum: 100, 
      default: 10,
      description: "每页数量"
    },
    search: { 
      type: "string",
      description: "搜索关键词"
    },
    sort: { 
      type: "string", 
      enum: ["username", "email", "createdAt", "updatedAt"],
      default: "createdAt",
      description: "排序字段"
    },
    order: { 
      type: "string", 
      enum: ["asc", "desc"], 
      default: "desc",
      description: "排序方向"
    },
    status: {
      type: "string",
      enum: ["active", "inactive", "all"],
      default: "all",
      description: "用户状态"
    },
    role: {
      type: "string",
      description: "用户角色"
    }
  }
};

// 用户列表响应 schema
export const userListResponseSchema = {
  type: "object",
  properties: {
    code: { type: "number" },
    message: { type: "string" },
    data: {
      type: "object",
      properties: {
        users: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              username: { type: "string" },
              email: { type: "string" },
              status: { type: "string" },
              roles: { type: "array", items: { type: "string" } },
              createdAt: { type: "string" },
              updatedAt: { type: "string" }
            }
          }
        },
        pagination: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            total: { type: "number" },
            totalPages: { type: "number" }
          }
        }
      }
    },
    timestamp: { type: "number" }
  }
};

// 认证相关 schema
export const loginRequestSchema = {
  type: "object",
  properties: {
    username: {
      type: "string",
      description: "用户名或邮箱"
    },
    password: {
      type: "string",
      description: "密码"
    }
  },
  required: ["username", "password"]
};

export const registerRequestSchema = {
  type: "object",
  properties: {
    username: {
      type: "string",
      description: "用户名"
    },
    email: {
      type: "string",
      format: "email",
      description: "邮箱地址"
    },
    password: {
      type: "string",
      minLength: 6,
      description: "密码，最少6位"
    }
  },
  required: ["username", "email", "password"]
};

export const authResponseSchema = {
  type: "object",
  properties: {
    code: { type: "number" },
    message: { type: "string" },
    data: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "用户名或邮箱"
        },
        password: {
          type: "string",
          description: "密码"
        }

        // token: {
        //   type: "string",
        //   description: "JWT 访问令牌"
        // },
        // refreshToken: {
        //   type: "string",
        //   description: "刷新令牌"
        // },
        // user: {
        //   type: "object",
        //   properties: {
        //     id: { type: "string" },
        //     username: { type: "string" },
        //     email: { type: "string" },
        //     role: { type: "string" }
        //   }
        // }
      }
    },
    timestamp: { type: "number" },
    requestId: { type: "string" }
  },
  required: ["code", "message", "data", "timestamp"]
};

// 系统信息 schema
export const systemInfoSchema = {
  type: "object",
  properties: {
    code: { type: "number" },
    message: { type: "string" },
    data: {
      type: "object",
      properties: {
        name: { type: "string" },
        version: { type: "string" },
        description: { type: "string" },
        technologies: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    timestamp: { type: "number" },
    requestId: { type: "string" }
  },
  required: ["code", "message", "data", "timestamp"]
};

export const healthCheckSchema = {
  type: "object",
  properties: {
    code: { type: "number" },
    message: { type: "string" },
    data: {
      type: "object",
      properties: {
        status: { type: "string" },
        uptime: { type: "number" },
        memory: {
          type: "object",
          properties: {
            rss: { type: "number" },
            heapTotal: { type: "number" },
            heapUsed: { type: "number" },
            external: { type: "number" }
          }
        }
      }
    },
    timestamp: { type: "number" },
    requestId: { type: "string" }
  },
  required: ["code", "message", "data", "timestamp"]
};
