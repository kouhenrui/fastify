import jwt, { JwtPayload } from "jsonwebtoken";
import { KEY } from "../../config/key";
import { ErrorFactory } from "../errors/custom-errors";

interface TokenPayload extends JwtPayload {
  id: string;
  role: string[];
  [key: string]: any;
}
interface signRes {
  token: string;
  expiresAt: number; // 过期时间戳 (秒)
}
/**
 * 生成 token
 * @param {TokenPayload}payload
 * @returns {string}
 */
const sign = (payload: TokenPayload): signRes => {
  const options: jwt.SignOptions = {
    expiresIn: KEY.expiresIn,
    audience: KEY.serverName,
    subject: KEY.serverName,
    issuer: KEY.serverName
  };
  const token = jwt.sign(payload, KEY.secretKey, options);

  // 计算过期时间（KEY.expiresIn是毫秒，需要转换为秒）
  const expiresInSec =
    Math.floor(Date.now() / 1000) + Math.floor(KEY.expiresIn / 1000);

  return {
    token,
    expiresAt: expiresInSec
  };
};

/**
 * 验证 token
 * @param token
 * @returns
 */
const verify = (token: string): TokenPayload => {
  const options: jwt.VerifyOptions = {
    audience: KEY.serverName,
    issuer: KEY.serverName,
    subject: KEY.serverName
  };

  const res = jwt.verify(token, KEY.secretKey, options);
  if (typeof res === "string" || res === null)
    throw ErrorFactory.crypto("verify Invalid token");
  return res as TokenPayload;
};

/**
 * 解码 token
 * @param token
 * @returns
 */
const decode = (token: string): TokenPayload => {
  const res = jwt.decode(token);
  if (typeof res === "string" || res === null)
    throw ErrorFactory.crypto("decode Invalid token");
  return res as TokenPayload;
};
export type { TokenPayload, signRes };
export { sign, verify, decode };
