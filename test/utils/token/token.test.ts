import { describe, expect, test } from "@jest/globals";
import jwt from "jsonwebtoken";
import {
  TokenPayload,
  decode,
  sign,
  signRes,
  verify
} from "../../../src/utils/token/index";

// Mock KEY config
jest.mock("../../../src/config/key", () => ({
  KEY: {
    secretKey: "test-secret-key-for-jwt",
    expiresIn: 86400000, // 24 hours in milliseconds
    serverName: "test-fastify-app"
  }
}));

describe("Token Utils", () => {
  const mockPayload: TokenPayload = {
    id: "user123",
    username: "testuser",
    email: "test@example.com",
    role: ["admin", "user"]
  };

  describe("sign", () => {
    test("应该生成有效的JWT token", () => {
      const result: signRes = sign(mockPayload);

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("expiresAt");
      expect(typeof result.token).toBe("string");
      expect(typeof result.expiresAt).toBe("number");
      expect(result.token).toMatch(
        /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
      );
    });

    test("应该包含正确的过期时间", () => {
      const result: signRes = sign(mockPayload);
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + Math.floor(86400000 / 1000); // 24 hours

      expect(result.expiresAt).toBeGreaterThan(now);
      expect(result.expiresAt).toBeLessThanOrEqual(expectedExpiry + 1); // 允许1秒误差
    });

    test("应该包含正确的JWT标准声明", () => {
      const result: signRes = sign(mockPayload);
      const decoded = jwt.decode(result.token) as any;

      expect(decoded.aud).toBe("test-fastify-app");
      expect(decoded.iss).toBe("test-fastify-app");
      expect(decoded.sub).toBe("test-fastify-app");
      expect(decoded.id).toBe("user123");
      expect(decoded.username).toBe("testuser");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.role).toEqual(["admin", "user"]);
    });

    test("应该处理最小payload", () => {
      const minimalPayload: TokenPayload = {
        id: "user456",
        role: []
      };

      const result: signRes = sign(minimalPayload);

      expect(result.token).toBeDefined();
      expect(result.expiresAt).toBeDefined();

      const decoded = jwt.decode(result.token) as any;
      expect(decoded.id).toBe("user456");
      expect(decoded.role).toEqual([]);
    });

    test("应该处理包含额外字段的payload", () => {
      const extendedPayload: TokenPayload = {
        ...mockPayload,
        customField: "customValue",
        permissions: ["read", "write", "delete"]
      };

      const result: signRes = sign(extendedPayload);

      expect(result.token).toBeDefined();

      const decoded = jwt.decode(result.token) as any;
      expect(decoded.customField).toBe("customValue");
      expect(decoded.permissions).toEqual(["read", "write", "delete"]);
    });
  });

  describe("verify", () => {
    test("应该验证有效的token", () => {
      const result: signRes = sign(mockPayload);
      const verifiedPayload = verify(result.token);

      expect(verifiedPayload.id).toBe(mockPayload.id);
      expect(verifiedPayload.username).toBe(mockPayload.username);
      expect(verifiedPayload.email).toBe(mockPayload.email);
      expect(verifiedPayload.role).toEqual(mockPayload.role);
    });

    test("应该验证token的签名", () => {
      const result: signRes = sign(mockPayload);
      const verifiedPayload = verify(result.token);

      expect(verifiedPayload).toBeDefined();
      expect(verifiedPayload.id).toBe("user123");
    });

    test("应该拒绝无效的token", () => {
      const invalidToken = "invalid.token.here";

      expect(() => {
        verify(invalidToken);
      }).toThrow();
    });

    test("应该拒绝空token", () => {
      expect(() => {
        verify("");
      }).toThrow();
    });

    test("应该拒绝格式错误的token", () => {
      const malformedToken = "not-a-jwt-token";

      expect(() => {
        verify(malformedToken);
      }).toThrow();
    });

    test("应该拒绝使用错误密钥签名的token", () => {
      const wrongKeyToken = jwt.sign(mockPayload, "wrong-secret-key");

      expect(() => {
        verify(wrongKeyToken);
      }).toThrow();
    });

    test("应该拒绝过期的token", () => {
      const expiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };

      const expiredToken = jwt.sign(expiredPayload, "test-secret-key-for-jwt");

      expect(() => {
        verify(expiredToken);
      }).toThrow();
    });

    test("应该拒绝未到生效时间的token", () => {
      const futurePayload = {
        ...mockPayload,
        nbf: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      const futureToken = jwt.sign(futurePayload, "test-secret-key-for-jwt");

      expect(() => {
        verify(futureToken);
      }).toThrow();
    });

    test("应该验证audience声明", () => {
      const wrongAudiencePayload = {
        ...mockPayload,
        aud: "wrong-audience"
      };

      const wrongAudienceToken = jwt.sign(
        wrongAudiencePayload,
        "test-secret-key-for-jwt"
      );

      expect(() => {
        verify(wrongAudienceToken);
      }).toThrow();
    });

    test("应该验证issuer声明", () => {
      const wrongIssuerPayload = {
        ...mockPayload,
        iss: "wrong-issuer"
      };

      const wrongIssuerToken = jwt.sign(
        wrongIssuerPayload,
        "test-secret-key-for-jwt"
      );

      expect(() => {
        verify(wrongIssuerToken);
      }).toThrow();
    });
  });

  describe("decode", () => {
    test("应该解码有效的token", () => {
      const result: signRes = sign(mockPayload);
      const decodedPayload = decode(result.token);

      expect(decodedPayload.id).toBe(mockPayload.id);
      expect(decodedPayload.username).toBe(mockPayload.username);
      expect(decodedPayload.email).toBe(mockPayload.email);
      expect(decodedPayload.role).toEqual(mockPayload.role);
    });

    test("应该解码过期token（不验证签名）", () => {
      const expiredPayload = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };

      const expiredToken = jwt.sign(expiredPayload, "test-secret-key-for-jwt");
      const decodedPayload = decode(expiredToken);

      expect(decodedPayload.id).toBe(mockPayload.id);
      expect(decodedPayload.exp).toBe(expiredPayload.exp);
    });

    test("应该解码使用错误密钥的token（不验证签名）", () => {
      const wrongKeyToken = jwt.sign(mockPayload, "wrong-secret-key");
      const decodedPayload = decode(wrongKeyToken);

      expect(decodedPayload.id).toBe(mockPayload.id);
      expect(decodedPayload.username).toBe(mockPayload.username);
    });

    test("应该拒绝无效格式的token", () => {
      const invalidToken = "invalid.token.here";

      expect(() => {
        decode(invalidToken);
      }).toThrow();
    });

    test("应该拒绝空token", () => {
      expect(() => {
        decode("");
      }).toThrow();
    });

    test("应该拒绝格式错误的token", () => {
      const malformedToken = "not-a-jwt-token";

      expect(() => {
        decode(malformedToken);
      }).toThrow();
    });

    test("应该处理包含null值的token", () => {
      const nullPayload: TokenPayload = {
        id: "user123",
        role: ["user"]
      };

      const result: signRes = sign(nullPayload);
      const decodedPayload = decode(result.token);

      expect(decodedPayload.id).toBe("user123");
      expect(decodedPayload.role).toEqual(["user"]);
    });
  });

  describe("错误处理", () => {
    test("verify应该抛出CryptoError", () => {
      const invalidToken = "invalid.token.here";

      expect(() => {
        verify(invalidToken);
      }).toThrow();
    });

    test("decode应该抛出CryptoError", () => {
      const invalidToken = "invalid.token.here";

      expect(() => {
        decode(invalidToken);
      }).toThrow();
    });
  });

  describe("边界情况", () => {
    test("应该处理非常大的payload", () => {
      const largePayload: TokenPayload = {
        id: "user123",
        role: Array(1000).fill("role"),
        largeData: "x".repeat(10000)
      };

      const result: signRes = sign(largePayload);
      const verifiedPayload = verify(result.token);

      expect(verifiedPayload.id).toBe("user123");
      expect(verifiedPayload.role).toHaveLength(1000);
      expect(verifiedPayload.largeData).toBe("x".repeat(10000));
    });

    test("应该处理特殊字符", () => {
      const specialPayload: TokenPayload = {
        id: "user123",
        username: "user@domain.com",
        email: "test+tag@example.com",
        role: ["admin", "user"],
        specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
        unicode: "你好世界 🌍"
      };

      const result: signRes = sign(specialPayload);
      const verifiedPayload = verify(result.token);

      expect(verifiedPayload.username).toBe("user@domain.com");
      expect(verifiedPayload.email).toBe("test+tag@example.com");
      expect(verifiedPayload.specialChars).toBe("!@#$%^&*()_+-=[]{}|;:,.<>?");
      expect(verifiedPayload.unicode).toBe("你好世界 🌍");
    });

    test("应该处理空字符串值", () => {
      const emptyPayload: TokenPayload = {
        id: "",
        username: "",
        email: "",
        role: []
      };

      const result: signRes = sign(emptyPayload);
      const verifiedPayload = verify(result.token);

      expect(verifiedPayload.id).toBe("");
      expect(verifiedPayload.username).toBe("");
      expect(verifiedPayload.email).toBe("");
      expect(verifiedPayload.role).toEqual([]);
    });
  });

  describe("性能测试", () => {
    test("sign应该快速执行", () => {
      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        sign({ ...mockPayload, id: `user${i}` });
      }
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // 应该在1秒内完成100次签名
    });

    test("verify应该快速执行", () => {
      const result: signRes = sign(mockPayload);

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        verify(result.token);
      }
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // 应该在1秒内完成100次验证
    });

    test("decode应该快速执行", () => {
      const result: signRes = sign(mockPayload);

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        decode(result.token);
      }
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // 应该在1秒内完成100次解码
    });
  });

  describe("类型安全", () => {
    test("TokenPayload应该包含必需字段", () => {
      const payload: TokenPayload = {
        id: "user123",
        role: ["admin"]
      };

      expect(payload.id).toBeDefined();
      expect(payload.role).toBeDefined();
    });

    test("signRes应该包含正确类型", () => {
      const result: signRes = sign(mockPayload);

      expect(typeof result.token).toBe("string");
      expect(typeof result.expiresAt).toBe("number");
      expect(result.expiresAt).toBeGreaterThan(0);
    });
  });
});
