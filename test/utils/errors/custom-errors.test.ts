import { describe, expect, test } from "@jest/globals";
import {
  CustomError,
  ErrorFactory
} from "../../../src/utils/errors/custom-errors";

describe("CustomError", () => {
  test("应该创建基础自定义错误", () => {
    const error = new CustomError("测试错误", 400, "TEST_ERROR", {
      field: "value"
    });

    expect(error.message).toBe("测试错误");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("TEST_ERROR");
    expect(error.details).toEqual({ field: "value" });
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe("CustomError");
  });

  test("应该使用默认值", () => {
    const error = new CustomError("默认错误");

    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("CUSTOM_ERROR");
    expect(error.isOperational).toBe(true);
  });
});

describe("ValidationError", () => {
  test("应该创建验证错误", () => {
    const validation = { field: "email", message: "Invalid email format" };
    const error = ErrorFactory.validation("验证失败", validation);

    expect(error.message).toBe("验证失败");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.validation).toEqual(validation);
  });
});

describe("ErrorFactory", () => {
  test("应该创建认证错误", () => {
    const error = ErrorFactory.authentication("认证失败", "AUTH_FAILED");

    expect(error.message).toBe("认证失败");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("AUTH_FAILED");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建授权错误", () => {
    const error = ErrorFactory.authorization(
      "权限不足",
      "INSUFFICIENT_PERMISSIONS"
    );

    expect(error.message).toBe("权限不足");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建未找到错误", () => {
    const error = ErrorFactory.notFound("资源未找到", "RESOURCE_NOT_FOUND");

    expect(error.message).toBe("资源未找到");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("RESOURCE_NOT_FOUND");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建冲突错误", () => {
    const error = ErrorFactory.conflict("资源冲突", "RESOURCE_CONFLICT");

    expect(error.message).toBe("资源冲突");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("RESOURCE_CONFLICT");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建限流错误", () => {
    const error = ErrorFactory.rateLimit("请求过于频繁", "RATE_LIMIT_EXCEEDED");

    expect(error.message).toBe("请求过于频繁");
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建配置错误", () => {
    const error = ErrorFactory.configuration("配置错误", "CONFIG_ERROR");

    expect(error.message).toBe("配置错误");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("CONFIG_ERROR");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建加密错误", () => {
    const error = ErrorFactory.crypto("加密失败", "CRYPTO_ERROR");

    expect(error.message).toBe("加密失败");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("CRYPTO_ERROR");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建数据库错误", () => {
    const error = ErrorFactory.database("数据库连接失败", "CONNECTION_ERROR");

    expect(error.message).toBe("数据库连接失败");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("DB_CONNECTION_ERROR");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建外部服务错误", () => {
    const error = ErrorFactory.externalService(
      "test-service",
      "外部服务不可用",
      "EXTERNAL_SERVICE_ERROR"
    );

    expect(error.message).toBe("test-service: 外部服务不可用");
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe("EXTERNAL_SERVICE_ERROR");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建超时错误", () => {
    const error = ErrorFactory.timeout("请求超时", "TIMEOUT_ERROR");

    expect(error.message).toBe("请求超时");
    expect(error.statusCode).toBe(408);
    expect(error.code).toBe("TIMEOUT_ERROR");
    expect(error).toBeInstanceOf(CustomError);
  });

  test("应该创建网络错误", () => {
    const error = ErrorFactory.network("网络连接失败", "NETWORK_ERROR");

    expect(error.message).toBe("网络连接失败");
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error).toBeInstanceOf(CustomError);
  });
});
