import { describe, expect, test } from '@jest/globals';
import {
  aesDecrypt,
  aesEncrypt,
  aesGcmDecrypt,
  aesGcmEncrypt,
  generateKey,
  generateUUID,
  hash,
  hmac,
  randomString,
  verifyHmac
} from '../../../src/utils/crypto/crypto';

// Mock KEY config
jest.mock('../../../src/config/key', () => ({
  KEY: {
    secretKey: 'test-secret-key-for-encryption'
  }
}));

describe('Crypto Utils', () => {
  const testPassword = 'test-password-123';
  const testText = 'Hello, World! 这是一个测试文本。';
  const testData = 'test-data-for-hashing';

  describe('generateKey', () => {
    test('应该生成指定长度的随机密钥', () => {
      const key1 = generateKey(16);
      const key2 = generateKey(32);
      const key3 = generateKey(64);

      expect(key1).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(key2).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(key3).toHaveLength(128); // 64 bytes = 128 hex chars
      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
    });

    test('应该使用默认长度32字节', () => {
      const key = generateKey();
      expect(key).toHaveLength(64); // 32 bytes = 64 hex chars
    });
  });

  describe('hash', () => {
    test('应该生成SHA256哈希', () => {
      const hashValue = hash(testData);

      expect(hashValue).toHaveLength(64); // SHA256 produces 64 hex chars
      expect(hashValue).toMatch(/^[a-f0-9]{64}$/);
    });

    test('应该生成MD5哈希', () => {
      const hashValue = hash(testData, 'md5');

      expect(hashValue).toHaveLength(32); // MD5 produces 32 hex chars
      expect(hashValue).toMatch(/^[a-f0-9]{32}$/);
    });

    test('应该生成SHA512哈希', () => {
      const hashValue = hash(testData, 'sha512');

      expect(hashValue).toHaveLength(128); // SHA512 produces 128 hex chars
      expect(hashValue).toMatch(/^[a-f0-9]{128}$/);
    });

    test('相同输入应该产生相同哈希', () => {
      const hash1 = hash(testData);
      const hash2 = hash(testData);

      expect(hash1).toBe(hash2);
    });

    test('不同输入应该产生不同哈希', () => {
      const hash1 = hash(testData);
      const hash2 = hash(`${testData  }different`);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hmac', () => {
    const secret = 'test-secret-key';

    test('应该生成HMAC签名', () => {
      const signature = hmac(testData, secret);

      expect(signature).toHaveLength(64); // SHA256 HMAC produces 64 hex chars
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    test('应该使用不同算法生成HMAC', () => {
      const sha256Hmac = hmac(testData, secret, 'sha256');
      const sha512Hmac = hmac(testData, secret, 'sha512');

      expect(sha256Hmac).toHaveLength(64);
      expect(sha512Hmac).toHaveLength(128);
      expect(sha256Hmac).not.toBe(sha512Hmac);
    });

    test('相同输入和密钥应该产生相同HMAC', () => {
      const hmac1 = hmac(testData, secret);
      const hmac2 = hmac(testData, secret);

      expect(hmac1).toBe(hmac2);
    });

    test('不同密钥应该产生不同HMAC', () => {
      const hmac1 = hmac(testData, secret);
      const hmac2 = hmac(testData, `${secret  }different`);

      expect(hmac1).not.toBe(hmac2);
    });
  });

  describe('verifyHmac', () => {
    const secret = 'test-secret-key';

    test('应该验证正确的HMAC', () => {
      const signature = hmac(testData, secret);
      const isValid = verifyHmac(testData, signature, secret);

      expect(isValid).toBe(true);
    });

    test('应该拒绝错误的HMAC', () => {
      const signature = hmac(testData, secret);
      const wrongSignature = signature.slice(0, -4) + '0000'; // 修改最后4个字符
      const isValid = verifyHmac(testData, wrongSignature, secret);

      expect(isValid).toBe(false);
    });

    test('应该拒绝错误的密钥', () => {
      const signature = hmac(testData, secret);
      const isValid = verifyHmac(testData, signature, `${secret}wrong`);

      expect(isValid).toBe(false);
    });

    test('应该拒绝错误的数据', () => {
      const signature = hmac(testData, secret);
      const isValid = verifyHmac(`${testData}wrong`, signature, secret);

      expect(isValid).toBe(false);
    });
  });

  describe('randomString', () => {
    test('应该生成指定长度的随机字符串', () => {
      const str1 = randomString(16);
      const str2 = randomString(32);
      const str3 = randomString(64);

      // base64url编码的长度大约是原始长度的4/3
      expect(str1.length).toBeGreaterThan(16);
      expect(str2.length).toBeGreaterThan(32);
      expect(str3.length).toBeGreaterThan(64);
      expect(str1).not.toBe(str2);
      expect(str2).not.toBe(str3);
    });

    test('应该使用默认长度32', () => {
      const str = randomString();
      // base64url编码的长度大约是原始长度的4/3
      expect(str.length).toBeGreaterThan(32);
    });

    test('应该生成base64url格式的字符串', () => {
      const str = randomString(16);
      expect(str).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('generateUUID', () => {
    test('应该生成有效的UUID', () => {
      const uuid = generateUUID();

      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('应该生成唯一的UUID', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('AES-256-CBC 加密/解密', () => {
    test('应该正确加密和解密文本', () => {
      const encrypted = aesEncrypt(testText, testPassword);
      const decrypted = aesDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(testText);
    });

    test('应该使用默认密钥加密', () => {
      const encrypted = aesEncrypt(testText);
      const decrypted = aesDecrypt(encrypted);

      expect(decrypted).toBe(testText);
    });

    test('相同输入应该产生不同加密结果（由于随机IV）', () => {
      const encrypted1 = aesEncrypt(testText, testPassword);
      const encrypted2 = aesEncrypt(testText, testPassword);

      expect(encrypted1).not.toBe(encrypted2);
    });

    test('错误密码应该导致解密失败', () => {
      const encrypted = aesEncrypt(testText, testPassword);

      expect(() => {
        aesDecrypt(encrypted, 'wrong-password');
      }).toThrow();
    });

    test('应该处理空字符串', () => {
      const encrypted = aesEncrypt('', testPassword);
      const decrypted = aesDecrypt(encrypted, testPassword);

      expect(decrypted).toBe('');
    });

    test('应该处理特殊字符', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = aesEncrypt(specialText, testPassword);
      const decrypted = aesDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(specialText);
    });

    test('应该处理Unicode字符', () => {
      const unicodeText = '你好世界 🌍 émojis';
      const encrypted = aesEncrypt(unicodeText, testPassword);
      const decrypted = aesDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(unicodeText);
    });
  });

  describe('AES-256-GCM 加密/解密', () => {
    test('应该正确加密和解密文本', () => {
      const encrypted = aesGcmEncrypt(testText, testPassword);
      const decrypted = aesGcmDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(testText);
    });

    test('相同输入应该产生不同加密结果（由于随机IV）', () => {
      const encrypted1 = aesGcmEncrypt(testText, testPassword);
      const encrypted2 = aesGcmEncrypt(testText, testPassword);

      expect(encrypted1).not.toBe(encrypted2);
    });

    test('错误密码应该导致解密失败', () => {
      const encrypted = aesGcmEncrypt(testText, testPassword);

      expect(() => {
        aesGcmDecrypt(encrypted, 'wrong-password');
      }).toThrow();
    });

    test('应该处理空字符串', () => {
      const encrypted = aesGcmEncrypt('', testPassword);
      const decrypted = aesGcmDecrypt(encrypted, testPassword);

      expect(decrypted).toBe('');
    });

    test('应该处理特殊字符', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = aesGcmEncrypt(specialText, testPassword);
      const decrypted = aesGcmDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(specialText);
    });

    test('应该处理Unicode字符', () => {
      const unicodeText = '你好世界 🌍 émojis';
      const encrypted = aesGcmEncrypt(unicodeText, testPassword);
      const decrypted = aesGcmDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(unicodeText);
    });
  });

  describe('错误处理', () => {
    test('解密函数应该抛出CryptoError', () => {
      expect(() => {
        aesGcmDecrypt('invalid-encrypted-data', testPassword);
      }).toThrow();
    });
  });

  describe('性能测试', () => {
    test('哈希函数应该快速执行', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        hash(testData + i);
      }
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // 应该在1秒内完成1000次哈希
    });

    test('HMAC函数应该快速执行', () => {
      const secret = 'test-secret';
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        hmac(testData + i, secret);
      }
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // 应该在1秒内完成1000次HMAC
    });
  });

  describe('边界情况', () => {
    test('应该处理很长的文本', () => {
      const longText = 'A'.repeat(10000);
      const encrypted = aesEncrypt(longText, testPassword);
      const decrypted = aesDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(longText);
    });

    test('应该处理很短的文本', () => {
      const shortText = 'A';
      const encrypted = aesEncrypt(shortText, testPassword);
      const decrypted = aesDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(shortText);
    });

    test('应该处理二进制数据', () => {
      const binaryText = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF]).toString('utf8');
      const encrypted = aesEncrypt(binaryText, testPassword);
      const decrypted = aesDecrypt(encrypted, testPassword);

      expect(decrypted).toBe(binaryText);
    });
  });
});
