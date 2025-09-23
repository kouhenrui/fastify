import tseslintParser from "@typescript-eslint/parser";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "logs/**",
      "*.log",
      "coverage/**",
      ".env*",
      "pnpm-lock.yaml"
    ]
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tseslintParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@typescript-eslint": tseslintPlugin
    },
    rules: {
      // TypeScript 相关规则
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "off", // 允许使用 any 类型
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // 通用规则
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",

      // 代码风格
      indent: "off", // 关闭缩进检查，让 Prettier 处理
      quotes: "off", // 关闭引号检查，让 Prettier 处理
      semi: ["error", "always"],
      "comma-dangle": ["error", "never"],
      "no-trailing-spaces": "error",
      "eol-last": "error",

      // 导入规则
      "no-duplicate-imports": "error",
      "sort-imports": [
        "error",
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ["none", "all", "multiple", "single"]
        }
      ]
    }
  }
];
