/** @type {import('jest').Config} */
export default {
  // 测试环境
  testEnvironment: 'node',
  
  // 预设配置
  preset: 'ts-jest/presets/default-esm',
  
  // 扩展名处理
  extensionsToTreatAsEsm: ['.ts'],
  
  // 转换配置
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2020',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true
      }
    }]
  },
  
  // 模块名映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/test/**/*.spec.ts'
  ],
  
  // 覆盖率配置 - 已禁用
  // collectCoverage: false,
  // coverageDirectory: 'coverage',
  // coverageReporters: ['text', 'lcov', 'html', 'json'],
  // collectCoverageFrom: [
  //   'src/**/*.{ts,tsx}',
  //   '!src/**/*.d.ts',
  //   '!src/**/*.test.{ts,tsx}',
  //   '!src/**/*.spec.{ts,tsx}',
  //   '!src/**/index.ts',
  //   '!src/**/types/**',
  //   '!src/**/interfaces/**'
  // ],
  
  // 覆盖率阈值 - 已禁用
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70
  //   }
  // },
  
  // 设置文件
  // setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // 测试超时时间
  testTimeout: 10000,
  
  // 清理模拟
  clearMocks: true,
  restoreMocks: true,
  
  // 详细输出
  verbose: true,
  
  // 忽略模式
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/logs/',
    '/prisma/'
  ],
  
  // 模块忽略模式
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  // 测试结果处理器
  reporters: [
    'default'
    // ['jest-junit', {
    //   outputDirectory: 'coverage',
    //   outputName: 'junit.xml'
    // }]
  ],
  
  // 全局设置
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // 模块解析
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 根目录
  rootDir: '.',
  
  // 测试环境变量
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};