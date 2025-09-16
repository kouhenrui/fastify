# Fastify 全栈应用

一个基于 Fastify 的现代化 Node.js 应用，集成了 MongoDB、Redis、PostgreSQL 数据库和完整的日志系统。

## ✨ 特性

- 🚀 **Fastify** - 高性能 Node.js Web 框架
- 🗄️ **多数据库支持** - MongoDB、Redis、PostgreSQL
- 📝 **完整日志系统** - Winston 日志库，支持文件轮转
- 🔧 **TypeScript** - 完整的类型支持
- 🏗️ **插件化架构** - 模块化设计，易于扩展
- 🔄 **热重载** - 开发环境自动重启
- 📊 **健康检查** - 数据库连接状态监控
- 🛡️ **错误处理** - 统一的错误处理机制

## 🏗️ 项目结构

```
fastify/
├── src/
│   ├── config/           # 配置文件
│   │   └── logger.ts     # 日志配置
│   ├── plugins/          # Fastify 插件
│   │   ├── index.ts      # 插件注册入口
│   │   ├── logger/       # 日志插件
│   │   ├── dataBase/     # 数据库插件
│   │   │   ├── mongodb.ts
│   │   │   └── postgres.ts
│   │   └── cache/        # 缓存插件
│   │       └── redis.ts
│   └── utils/            # 工具函数
├── logs/                 # 日志文件目录
├── dist/                 # 编译输出目录
├── main.ts              # 应用入口
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
└── .env                 # 环境变量
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MongoDB >= 4.4
- Redis >= 6.0
- PostgreSQL >= 13

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd fastify

# 安装依赖
pnpm install
```

### 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/fastify-app
MONGODB_USER=
MONGODB_PASSWORD=

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# PostgreSQL 配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=fastify_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_SSL=false

# 数据库连接池配置
DB_POOL_MIN=2
DB_POOL_MAX=10

# 日志配置
LOG_LEVEL=info
LOG_FILE_MAX_SIZE=20m
LOG_FILE_MAX_FILES=14d
LOG_ERROR_MAX_FILES=30d
```

### 启动应用

```bash
# 开发模式（热重载）
pnpm run dev

# 开发模式（监听文件变化）
pnpm run dev:watch

# 构建项目
pnpm run build

# 生产模式
pnpm run start
```

## 📊 API 接口

### 健康检查

```http
GET /health
```

响应示例：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "mongodb": true,
    "redis": true,
    "postgres": true
  }
}
```

### 根路径

```http
GET /
```

响应示例：
```json
{
  "message": "Fastify 服务运行正常",
  "databases": {
    "mongodb": "已连接",
    "redis": "已连接",
    "postgres": "已连接"
  }
}
```

## 🗄️ 数据库使用

### MongoDB

```typescript
// 在路由中使用
fastify.get('/users', async (request, reply) => {
  const users = await fastify.mongoose.model('User').find();
  return users;
});
```

### Redis

```typescript
// 缓存操作
await fastify.cache.set('key', { data: 'value' }, 3600); // 1小时过期
const data = await fastify.cache.get('key');
await fastify.cache.del('key');
```

### PostgreSQL

```typescript
// 数据库查询
const result = await fastify.db.query('SELECT * FROM users WHERE id = $1', [userId]);

// 事务操作
await fastify.db.transaction(async (client) => {
  await client.query('INSERT INTO users (name) VALUES ($1)', ['John']);
  await client.query('INSERT INTO profiles (user_id) VALUES ($1)', [userId]);
});
```

## 📝 日志系统

### 日志级别

- `error` - 错误日志
- `warn` - 警告日志
- `info` - 信息日志
- `http` - HTTP 请求日志
- `debug` - 调试日志

### 使用日志

```typescript
// 在路由中使用
fastify.get('/test', async (request, reply) => {
  fastify.logger.info('处理测试请求', { userId: 123 });
  fastify.logger.error('错误信息', { error: 'Something went wrong' });
  return { message: 'success' };
});
```

### 日志文件

- `logs/application-YYYY-MM-DD.log` - 应用日志
- `logs/error-YYYY-MM-DD.log` - 错误日志
- `logs/exceptions.log` - 异常日志
- `logs/rejections.log` - Promise 拒绝日志

## 🛠️ 开发工具

### 代码质量

```bash
# 代码检查
pnpm run lint

# 自动修复
pnpm run lint:fix

# 代码格式化
pnpm run format

# 检查格式
pnpm run format:check
```

### 测试

```bash
# 运行测试
pnpm run test

# 监听模式
pnpm run test:watch

# 覆盖率报告
pnpm run test:coverage
```

## 🔧 配置说明

### TypeScript 配置

项目使用严格的 TypeScript 配置，包括：

- 严格类型检查
- ES2022 目标版本
- ES Modules 支持
- 路径映射

### 插件系统

所有功能都通过 Fastify 插件实现：

- **日志插件** - 请求日志、错误处理
- **数据库插件** - MongoDB、PostgreSQL 连接
- **缓存插件** - Redis 连接和缓存操作

## 🚀 部署

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### 环境变量

生产环境需要设置以下环境变量：

- `NODE_ENV=production`
- 数据库连接信息
- 日志级别配置

## 📚 技术栈

- **框架**: Fastify 5.x
- **语言**: TypeScript 5.x
- **数据库**: MongoDB, PostgreSQL, Redis
- **日志**: Winston
- **工具**: pnpm, ESLint, Prettier, Jest

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请提交 Issue 或联系维护者。
