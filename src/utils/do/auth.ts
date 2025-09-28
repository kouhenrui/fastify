interface LoginRequestBody {
  username: string;
  password: string;
}

interface RegisterRequestBody {
  username: string;
  password?: string;
  phone: string;
  email?: string;
}

// 微信登录请求体
interface WechatLoginRequestBody {
  code: string; // 微信授权码
  encryptedData?: string; // 加密数据
  iv?: string; // 初始向量
  phoneCode?: string; // 手机号授权码
}

// 商家登录请求体
interface MerchantLoginRequestBody {
  phone: string;
  password: string;
}

// 微信登录响应
interface WechatLoginResponse {
  token: string;
  expiresAt: number;
  user: {
    id: string;
    username: string;
    phone?: string;
    userType: string;
    isVerified: boolean;
  };
}

// 微信登录和注册请求体
interface WechatLoginAndRegisterRequestBody {
  code: string; // 微信授权码
  encryptedData?: string; // 加密数据
  iv?: string; // 初始向量
  phone: string; // 手机号
}
export type {
  LoginRequestBody,
  RegisterRequestBody,
  WechatLoginRequestBody,
  MerchantLoginRequestBody,
  WechatLoginResponse,
  WechatLoginAndRegisterRequestBody
};
