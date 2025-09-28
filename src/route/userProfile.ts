import { FastifyInstance } from "fastify";
import userProfileController from "../controller/userProfile.controller";

// 用户信息更新请求schema
const updateUserProfileRequestSchema = {
  type: "object",
  properties: {
    realName: {
      type: "string",
      maxLength: 50,
      description: "真实姓名"
    },
    idCard: {
      type: "string",
      pattern: "^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$",
      description: "身份证号"
    },
    addresses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["home", "work", "other"],
            description: "地址类型"
          },
          name: {
            type: "string",
            maxLength: 100,
            description: "地址名称"
          },
          address: {
            type: "string",
            maxLength: 500,
            description: "详细地址"
          },
          isDefault: {
            type: "boolean",
            description: "是否默认地址"
          },
          coordinates: {
            type: "object",
            properties: {
              latitude: {
                type: "number",
                minimum: -90,
                maximum: 90,
                description: "纬度"
              },
              longitude: {
                type: "number",
                minimum: -180,
                maximum: 180,
                description: "经度"
              }
            }
          }
        },
        required: ["type", "name", "address"]
      },
      description: "地址列表"
    },
    avatar: {
      type: "string",
      description: "头像URL"
    },
    gender: {
      type: "string",
      enum: ["male", "female", "other"],
      description: "性别"
    },
    birthday: {
      type: "string",
      format: "date",
      description: "生日"
    },
    emergencyContact: {
      type: "string",
      maxLength: 50,
      description: "紧急联系人"
    },
    emergencyPhone: {
      type: "string",
      pattern: "^1[3-9]\\d{9}$",
      description: "紧急联系人电话"
    },
    preferences: {
      type: "object",
      properties: {
        language: {
          type: "string",
          description: "语言偏好"
        },
        notifications: {
          type: "boolean",
          description: "是否接收通知"
        },
        marketing: {
          type: "boolean",
          description: "是否接收营销信息"
        }
      }
    }
  }
};

// 用户验证请求schema
const verifyUserRequestSchema = {
  type: "object",
  properties: {
    realName: {
      type: "string",
      required: true,
      maxLength: 50,
      description: "真实姓名"
    },
    idCard: {
      type: "string",
      required: true,
      pattern: "^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$",
      description: "身份证号"
    }
  },
  required: ["realName", "idCard"]
};

// 用户信息响应schema
const userProfileResponseSchema = {
  type: "object",
  properties: {
    code: { type: "number" },
    message: { type: "string" },
    data: {
      type: "object",
      properties: {
        account: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            userType: { type: "string" },
            isActive: { type: "boolean" },
            createdAt: { type: "string" },
            updatedAt: { type: "string" }
          }
        },
        profile: {
          type: "object",
          properties: {
            id: { type: "string" },
            accountId: { type: "string" },
            realName: { type: "string" },
            address: { type: "string" },
            avatar: { type: "string" },
            gender: { type: "string" },
            birthday: { type: "string" },
            emergencyContact: { type: "string" },
            emergencyPhone: { type: "string" },
            isVerified: { type: "boolean" },
            preferences: {
              type: "object",
              properties: {
                language: { type: "string" },
                notifications: { type: "boolean" },
                marketing: { type: "boolean" }
              }
            },
            createdAt: { type: "string" },
            updatedAt: { type: "string" }
          }
        }
      }
    },
    timestamp: { type: "number" }
  },
  required: ["code", "message", "data", "timestamp"]
};

export default async function userProfileRoutes(app: FastifyInstance) {
  // 获取用户信息
  app.get(
    "/user-profile/:accountId",
    {
      schema: {
        tags: ["用户信息"],
        summary: "获取用户信息",
        description: "根据账户ID获取用户完整信息",
        params: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              description: "账户ID"
            }
          },
          required: ["accountId"]
        },
        response: {
          200: userProfileResponseSchema
        }
      }
    },
    userProfileController.getUserProfile
  );

  // 更新用户信息
  app.put(
    "/user-profile/:accountId",
    {
      schema: {
        tags: ["用户信息"],
        summary: "更新用户信息",
        description: "更新用户详细信息",
        params: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              description: "账户ID"
            }
          },
          required: ["accountId"]
        },
        body: updateUserProfileRequestSchema,
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
              timestamp: { type: "number" }
            }
          }
        }
      }
    },
    userProfileController.updateUserProfile
  );

  // 验证用户身份
  app.post(
    "/user-profile/:accountId/verify",
    {
      schema: {
        tags: ["用户信息"],
        summary: "验证用户身份",
        description: "通过真实姓名和身份证号验证用户身份",
        params: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              description: "账户ID"
            }
          },
          required: ["accountId"]
        },
        body: verifyUserRequestSchema,
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
              timestamp: { type: "number" }
            }
          }
        }
      }
    },
    userProfileController.verifyUser
  );

  // 获取已验证用户列表
  app.get(
    "/user-profile/verified",
    {
      schema: {
        tags: ["用户信息"],
        summary: "获取已验证用户列表",
        description: "获取所有已验证身份的用户列表",
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "number" },
              message: { type: "string" },
              data: {
                type: "array",
                items: { type: "object" }
              },
              timestamp: { type: "number" }
            }
          }
        }
      }
    },
    userProfileController.getVerifiedUsers
  );

  // 删除用户信息
  app.delete(
    "/user-profile/:accountId",
    {
      schema: {
        tags: ["用户信息"],
        summary: "删除用户信息",
        description: "软删除用户信息",
        params: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              description: "账户ID"
            }
          },
          required: ["accountId"]
        },
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "number" },
              message: { type: "string" },
              data: {
                type: "object",
                properties: {
                  deleted: { type: "boolean" }
                }
              },
              timestamp: { type: "number" }
            }
          }
        }
      }
    },
    userProfileController.deleteUserProfile
  );

  // 添加地址
  app.post(
    "/user-profile/:accountId/addresses",
    {
      schema: {
        tags: ["用户信息"],
        summary: "添加地址",
        description: "为用户添加新地址",
        params: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              description: "账户ID"
            }
          },
          required: ["accountId"]
        },
        body: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["home", "work", "other"],
              description: "地址类型"
            },
            name: {
              type: "string",
              maxLength: 100,
              description: "地址名称"
            },
            address: {
              type: "string",
              maxLength: 500,
              description: "详细地址"
            },
            isDefault: {
              type: "boolean",
              description: "是否默认地址"
            },
            coordinates: {
              type: "object",
              properties: {
                latitude: {
                  type: "number",
                  minimum: -90,
                  maximum: 90,
                  description: "纬度"
                },
                longitude: {
                  type: "number",
                  minimum: -180,
                  maximum: 180,
                  description: "经度"
                }
              }
            }
          },
          required: ["type", "name", "address"]
        },
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
              timestamp: { type: "number" }
            }
          }
        }
      }
    },
    userProfileController.addAddress
  );

  // 更新地址
  app.put(
    "/user-profile/:accountId/addresses/:addressIndex",
    {
      schema: {
        tags: ["用户信息"],
        summary: "更新地址",
        description: "更新指定索引的地址信息",
        params: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              description: "账户ID"
            },
            addressIndex: {
              type: "string",
              description: "地址索引"
            }
          },
          required: ["accountId", "addressIndex"]
        },
        body: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["home", "work", "other"],
              description: "地址类型"
            },
            name: {
              type: "string",
              maxLength: 100,
              description: "地址名称"
            },
            address: {
              type: "string",
              maxLength: 500,
              description: "详细地址"
            },
            isDefault: {
              type: "boolean",
              description: "是否默认地址"
            },
            coordinates: {
              type: "object",
              properties: {
                latitude: {
                  type: "number",
                  minimum: -90,
                  maximum: 90,
                  description: "纬度"
                },
                longitude: {
                  type: "number",
                  minimum: -180,
                  maximum: 180,
                  description: "经度"
                }
              }
            }
          }
        },
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
              timestamp: { type: "number" }
            }
          }
        }
      }
    },
    userProfileController.updateAddress
  );

  // 删除地址
  app.delete(
    "/user-profile/:accountId/addresses/:addressIndex",
    {
      schema: {
        tags: ["用户信息"],
        summary: "删除地址",
        description: "删除指定索引的地址",
        params: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              description: "账户ID"
            },
            addressIndex: {
              type: "string",
              description: "地址索引"
            }
          },
          required: ["accountId", "addressIndex"]
        },
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
              timestamp: { type: "number" }
            }
          }
        }
      }
    },
    userProfileController.removeAddress
  );

  // 设置默认地址
  app.post(
    "/user-profile/:accountId/addresses/:addressIndex/default",
    {
      schema: {
        tags: ["用户信息"],
        summary: "设置默认地址",
        description: "设置指定索引的地址为默认地址",
        params: {
          type: "object",
          properties: {
            accountId: {
              type: "string",
              description: "账户ID"
            },
            addressIndex: {
              type: "string",
              description: "地址索引"
            }
          },
          required: ["accountId", "addressIndex"]
        },
        response: {
          200: {
            type: "object",
            properties: {
              code: { type: "number" },
              message: { type: "string" },
              data: { type: "object" },
              timestamp: { type: "number" }
            }
          }
        }
      }
    },
    userProfileController.setDefaultAddress
  );
}
