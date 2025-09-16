import { FastifyPluginAsync } from 'fastify';
import { Pool, PoolClient } from 'pg';
import { logger } from '../../config/logger.js';

// PostgreSQL 连接选项接口
interface PostgresOptions {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  options?: any;
}

// PostgreSQL 插件
const postgresPlugin: FastifyPluginAsync<PostgresOptions> = async (
  fastify,
  options
) => {
  const {
    host,
    port,
    database,
    user,
    password,
    ssl = false,
    options: pgOptions = {}
  } = options;

  // 默认连接池配置
  const defaultConfig = {
    host,
    port,
    database,
    user,
    password,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ...pgOptions
  };

  // 创建连接池
  const pool = new Pool(defaultConfig);

  // 测试连接
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    // 监听连接池事件
    pool.on('connect', (_client: PoolClient) => {
      logger.debug('PostgreSQL 客户端已连接');
    });

    pool.on('error', (error: Error) => {
      logger.error('PostgreSQL 连接池错误', { error: error.message });
    });

    // 优雅关闭
    fastify.addHook('onClose', async () => {
      await pool.end();
      logger.info('PostgreSQL 连接池已关闭');
    });

    // 将连接池添加到 fastify 实例
    fastify.decorate('pg', pool);

    // 添加数据库工具方法
    fastify.decorate('db', {
      // 执行查询
      query: async (text: string, params?: any[]) => {
        const start = Date.now();
        try {
          const result = await pool.query(text, params);
          const duration = Date.now() - start;
          logger.debug('PostgreSQL 查询执行', {
            query: text,
            params,
            duration: `${duration}ms`,
            rowCount: result.rowCount
          });
          return result;
        } catch (error) {
          const duration = Date.now() - start;
          logger.error('PostgreSQL 查询错误', {
            query: text,
            params,
            duration: `${duration}ms`,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },

      // 获取客户端
      getClient: async () => {
        return await pool.connect();
      },

      // 事务执行
      transaction: async (callback: (client: PoolClient) => Promise<any>) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await callback(client);
          await client.query('COMMIT');
          return result;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },

      // 健康检查
      healthCheck: async () => {
        try {
          const result = await pool.query('SELECT 1 as health');
          return result.rows[0].health === 1;
        } catch (error) {
          logger.error('PostgreSQL 健康检查失败', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return false;
        }
      }
    });
  } catch (error) {
    logger.error('PostgreSQL 连接失败', {
      error: error instanceof Error ? error.message : 'Unknown error',
      host,
      port,
      database,
      user
    });
    throw error;
  }
};

// 类型声明
declare module 'fastify' {
  interface FastifyInstance {
    pg: Pool;
    db: {
      query: (text: string, params?: any[]) => Promise<any>;
      getClient: () => Promise<PoolClient>;
      transaction: (
        callback: (client: PoolClient) => Promise<any>
      ) => Promise<any>;
      healthCheck: () => Promise<boolean>;
    };
  }
}

export default postgresPlugin;
