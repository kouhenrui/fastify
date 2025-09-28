# 家政服务小程序后端数据库设计

## 数据库概述

基于MongoDB的家政服务小程序后端数据库设计，支持用户管理、商家管理、服务管理、订单管理、支付管理等完整业务流程。

## 表结构设计

### 1. 账户表 (accounts)
**用途**: 存储用户和商家的基本账户信息

```typescript
interface IAccount {
  _id: string;
  username: string;           // 用户名
  email?: string;            // 邮箱
  phone?: string;            // 手机号
  password: string;          // 密码
  avatar?: string;           // 头像
  userType: 'customer' | 'merchant' | 'admin'; // 用户类型
  isActive: boolean;         // 是否激活
  roles: string[];           // 角色列表
  lastLoginAt?: Date;        // 最后登录时间
  accessToken?: string;      // 访问令牌
  // 基础字段
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

**索引优化**:
- `username` (唯一索引)
- `email` (唯一索引)
- `phone` (唯一索引)
- `userType` (普通索引)
- `isActive` (普通索引)

### 2. 用户信息表 (user_profiles)
**用途**: 存储用户的详细个人信息和微信信息

```typescript
interface IUserProfile {
  _id: string;
  accountId: string;         // 关联账户ID
  wechatOpenId?: string;    // 微信OpenID
  wechatUnionId?: string;   // 微信UnionID
  realName?: string;        // 真实姓名
  idCard?: string;          // 身份证号
  addresses?: Array<{       // 地址列表
    type: 'home' | 'work' | 'other';
    name: string;
    address: string;
    isDefault?: boolean;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }>;
  isVerified: boolean;      // 是否已认证
  avatar?: string;          // 头像
  gender?: 'male' | 'female' | 'other';
  birthday?: Date;
  emergencyContact?: string;
  emergencyPhone?: string;
  preferences?: {
    language?: string;
    notifications?: boolean;
    marketing?: boolean;
  };
}
```

**索引优化**:
- `accountId` (唯一索引)
- `wechatOpenId` (唯一索引)
- `wechatUnionId` (普通索引)

### 3. 商家信息表 (merchants)
**用途**: 存储商家的详细信息和认证状态

```typescript
interface IMerchant {
  _id: string;
  accountId: string;         // 关联账户ID
  businessName: string;     // 商家名称
  businessLicense: string;  // 营业执照号
  contactPerson: string;    // 联系人
  contactPhone: string;     // 联系电话
  businessInfo: {
    description: string;
    address: string;
    serviceAreas: string[];
    serviceCategories: string[];
    businessHours: {
      weekdays: string;
      weekends: string;
    };
  };
  verification: {
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    verifiedAt?: Date;
    verifiedBy?: string;
  };
  statistics: {
    totalOrders: number;
    completedOrders: number;
    averageRating: number;
    totalRevenue: number;
  };
}
```

**索引优化**:
- `accountId` (唯一索引)
- `businessLicense` (唯一索引)
- `verification.status` (普通索引)
- `businessInfo.serviceCategories` (普通索引)

### 4. 服务表 (services)
**用途**: 存储家政服务的详细信息

```typescript
interface IService {
  _id: string;
  name: string;             // 服务名称
  description: string;      // 服务描述
  category: string;         // 服务分类
  price: number;           // 服务价格
  unit: 'hour' | 'day' | 'time' | 'square'; // 计费单位
  merchantId: string;      // 商家ID
  isActive: boolean;       // 是否启用
  images?: string[];       // 服务图片
  tags?: string[];         // 服务标签
  requirements?: {
    minArea?: number;
    maxArea?: number;
    tools?: string[];
    materials?: string[];
  };
}
```

**索引优化**:
- `merchantId` (普通索引)
- `category` (普通索引)
- `isActive` (普通索引)
- `tags` (普通索引)

### 5. 订单表 (orders)
**用途**: 存储订单的完整信息

```typescript
interface IOrder {
  _id: string;
  orderNo: string;          // 订单号
  customerId: string;       // 客户ID
  merchantId: string;       // 商家ID
  serviceId: string;        // 服务ID
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'partial_refund';
  
  serviceInfo: {
    name: string;
    description: string;
    price: number;
    unit: string;
    quantity: number;
    totalPrice: number;
  };
  
  serviceAddress: {
    type: 'home' | 'work' | 'other';
    name: string;
    address: string;
    contactName: string;
    contactPhone: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  serviceTime: {
    scheduledDate: Date;
    scheduledTime: string;
    estimatedDuration: number;
    actualStartTime?: Date;
    actualEndTime?: Date;
  };
  
  rating?: {
    score: number;
    comment?: string;
    images?: string[];
    ratedAt: Date;
  };
}
```

**索引优化**:
- `orderNo` (唯一索引)
- `customerId` (普通索引)
- `merchantId` (普通索引)
- `serviceId` (普通索引)
- `status` (普通索引)
- `paymentStatus` (普通索引)
- `serviceTime.scheduledDate` (普通索引)

### 6. 支付表 (payments)
**用途**: 存储支付相关信息

```typescript
interface IPayment {
  _id: string;
  paymentNo: string;        // 支付单号
  orderId: string;         // 订单ID
  orderNo: string;         // 订单号
  customerId: string;      // 客户ID
  merchantId: string;      // 商家ID
  amount: number;          // 支付金额
  method: 'wechat' | 'alipay' | 'bank_card' | 'cash' | 'balance';
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';
  
  thirdPartyPayment?: {
    provider: 'wechat' | 'alipay' | 'bank';
    transactionId?: string;
    prepayId?: string;
    qrCode?: string;
  };
  
  paymentTime?: Date;
  refund?: {
    amount: number;
    reason: string;
    refundNo: string;
    status: 'pending' | 'success' | 'failed';
  };
  
  fees: {
    platformFee: number;
    paymentFee: number;
    totalFee: number;
  };
}
```

**索引优化**:
- `paymentNo` (唯一索引)
- `orderId` (普通索引)
- `orderNo` (普通索引)
- `customerId` (普通索引)
- `merchantId` (普通索引)
- `status` (普通索引)
- `thirdPartyPayment.transactionId` (普通索引)

### 7. 订单历史表 (order_histories)
**用途**: 记录订单状态变更历史

```typescript
interface IOrderHistory {
  _id: string;
  orderId: string;         // 订单ID
  orderNo: string;         // 订单号
  action: string;          // 操作类型
  description: string;     // 操作描述
  operatorId: string;     // 操作人ID
  operatorType: 'customer' | 'merchant' | 'system' | 'admin';
  previousStatus?: string; // 之前状态
  currentStatus?: string;  // 当前状态
  timestamp: Date;         // 操作时间
}
```

**索引优化**:
- `orderId` (普通索引)
- `orderNo` (普通索引)
- `operatorId` (普通索引)
- `timestamp` (普通索引)

## 业务流程设计

### 1. 用户注册流程
1. 微信授权登录 → 创建Account记录
2. 创建UserProfile记录
3. 绑定微信信息

### 2. 商家入驻流程
1. 商家注册 → 创建Account记录
2. 提交认证信息 → 创建Merchant记录
3. 管理员审核 → 更新verification.status
4. 审核通过后商家可发布服务

### 3. 订单流程
1. 客户下单 → 创建Order记录
2. 商家接单 → 更新订单状态
3. 服务进行 → 更新订单状态
4. 服务完成 → 创建Payment记录
5. 订单完成 → 客户评价

### 4. 支付流程
1. 创建支付单 → 创建Payment记录
2. 调用第三方支付 → 更新支付状态
3. 支付成功回调 → 更新订单状态
4. 分账结算 → 更新settlement信息

## 性能优化建议

### 1. 索引优化
- 为常用查询字段建立复合索引
- 避免过多索引影响写入性能
- 定期分析慢查询并优化

### 2. 数据分片
- 按时间分片存储历史数据
- 按地区分片存储订单数据
- 按商家分片存储服务数据

### 3. 缓存策略
- 热点数据使用Redis缓存
- 用户信息缓存
- 服务列表缓存
- 订单状态缓存

### 4. 数据归档
- 超过1年的订单数据归档
- 超过6个月的支付记录归档
- 定期清理日志数据

## 安全考虑

### 1. 数据加密
- 敏感信息加密存储
- 身份证号加密
- 银行卡信息加密

### 2. 访问控制
- 基于角色的权限控制
- API访问频率限制
- 数据脱敏处理

### 3. 审计日志
- 关键操作记录
- 数据变更追踪
- 异常行为监控

## 监控指标

### 1. 业务指标
- 订单量统计
- 支付成功率
- 用户活跃度
- 商家服务质量

### 2. 技术指标
- 数据库连接数
- 查询响应时间
- 索引使用率
- 存储空间使用

这个数据库设计支持完整的家政服务业务流程，具有良好的扩展性和性能优化。
