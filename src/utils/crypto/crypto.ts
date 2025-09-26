import crypto from "crypto";
import { ErrorFactory } from "../errors/custom-errors";
import { KEY } from "../../config/key";

// 加密算法
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 对于 GCM 模式，IV 长度固定为 12 字节
const SALT_LENGTH = 64;

/**
 * 生成随机密钥
 * @param length 密钥长度，默认 32 字节
 * @returns 随机密钥
 */
export function generateKey(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * 从密码派生密钥
 * @param password 密码
 * @param salt 盐值
 * @returns 派生的密钥
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha512");
}

/**
 * 加密数据
 * @param text 要加密的文本
 * @param password 加密密码，可选，默认使用配置中的密钥
 * @returns 加密后的数据
 */
export function encrypt(text: string, password?: string): string {
  try {
    const key = password || KEY.secretKey;
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const derivedKey = deriveKey(key, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    cipher.setAAD(Buffer.from("fastify-app", "utf8"));
    const encrypted = cipher.update(text, "utf8", "hex");

    return encrypted;
  } catch (error: any) {
    throw ErrorFactory.crypto(`加密失败: ${error.message}`);
  }
}

/**
 * 解密数据
 * @param encryptedData 加密的数据
 * @param password 解密密码，可选，默认使用配置中的密钥
 * @returns 解密后的文本
 */
export function decrypt(encryptedData: string, password?: string): string {
  try {
    const key = password || KEY.secretKey;
    const parts = encryptedData.split(":");

    if (parts.length !== 4) throw ErrorFactory.crypto("无效的加密数据格式");

    const [saltHex, ivHex, tagHex, encrypted] = parts;
    if (!saltHex || !ivHex || !tagHex || encrypted === undefined)
      throw ErrorFactory.crypto("无效的加密数据格式");
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const derivedKey = deriveKey(key, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAAD(Buffer.from("fastify-app", "utf8"));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error: any) {
    throw ErrorFactory.crypto(`解密失败: ${error.message}`);
  }
}

/**
 * 生成哈希值
 * @param data 要哈希的数据
 * @param algorithm 哈希算法，默认 sha256
 * @returns 哈希值
 */
export function hash(data: string, algorithm: string = "sha256"): string {
  return crypto.createHash(algorithm).update(data).digest("hex");
}

/**
 * 生成 HMAC
 * @param data 要签名的数据
 * @param secret 密钥
 * @param algorithm 算法，默认 sha256
 * @returns HMAC 值
 */
export function hmac(
  data: string,
  secret: string,
  algorithm: string = "sha256"
): string {
  return crypto.createHmac(algorithm, secret).update(data).digest("hex");
}

/**
 * 验证 HMAC
 * @param data 原始数据
 * @param signature 签名
 * @param secret 密钥
 * @param algorithm 算法，默认 sha256
 * @returns 是否验证通过
 */
export function verifyHmac(
  data: string,
  signature: string,
  secret: string,
  algorithm: string = "sha256"
): boolean {
  try {
    const expectedSignature = hmac(data, secret, algorithm);
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch (_error) {
    return false;
  }
}

/**
 * 生成随机字符串
 * @param length 长度
 * @returns 随机字符串
 */
export function randomString(length: number = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

/**
 * 生成 UUID
 * @returns UUID 字符串
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * AES-256-CBC 加密
 */
export function aesEncrypt(text: string, password?: string): string {
  const pwd = password || KEY.secretKey;
  const key = crypto.createHash("sha256").update(pwd).digest();
  const iv = crypto.randomBytes(16); // CBC 需要 16 字节 IV

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final()
  ]);

  // 拼接 IV + 密文
  return Buffer.concat([iv, encrypted]).toString("base64");
}

/**
 * AES-256-CBC 解密
 */
export function aesDecrypt(encryptedData: string, password?: string): string {
  const pwd = password || KEY.secretKey;
  const data = Buffer.from(encryptedData, "base64");
  const iv = data.subarray(0, 16);
  const encrypted = data.subarray(16);

  const key = crypto.createHash("sha256").update(pwd).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
}

/**
 * AES-256-GCM 加密（带认证）
 * @param text 要加密的文本
 * @param password 加密密码
 * @returns 加密后的数据
 */
export function aesGcmEncrypt(text: string, password: string): string {
  try {
    const key = crypto.createHash("sha256").update(password).digest();
    const iv = crypto.randomBytes(12); // GCM 推荐 12 字节 IV
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // 获取认证标签
    const authTag = cipher.getAuthTag();

    // 返回格式: iv:authTag:encrypted
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error: any) {
    throw ErrorFactory.crypto(`AES-GCM加密失败: ${error.message}`);
  }
}

/**
 * AES-256-GCM 解密（带认证）
 * @param encryptedData 加密的数据
 * @param password 解密密码
 * @returns 解密后的文本
 */
export function aesGcmDecrypt(encryptedData: string, password: string): string {
  try {
    const key = crypto.createHash("sha256").update(password).digest();

    // 解析加密数据: iv:authTag:encrypted
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw ErrorFactory.crypto("无效的加密数据格式");
    }

    const [ivHex, authTagHex, encrypted] = parts;
    if (!ivHex || !authTagHex || encrypted === undefined) {
      throw ErrorFactory.crypto("无效的加密数据格式");
    }
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8") as string;
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error: any) {
    throw ErrorFactory.crypto(`AES-GCM解密失败: ${error.message}`);
  }
}
