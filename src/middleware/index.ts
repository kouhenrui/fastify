import { FastifyInstance } from 'fastify';
import authMiddleware from './auth';

export async function registerMiddleware(fastify: FastifyInstance) {
  // 注册认证中间件
  await fastify.register(authMiddleware);
}

export { authMiddleware };
