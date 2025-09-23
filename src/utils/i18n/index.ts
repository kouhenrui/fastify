import fs from "fs";
import path from "path";
import { ErrorFactory } from "../errors/custom-errors";
import { KEY } from "../../config/key";

// 语言类型定义
export type Language = "zh-CN" | "en-US" | "ja-JP";

// 翻译数据接口
interface TranslationData {
  [key: string]: string | TranslationData;
}

// 翻译缓存
const translationCache: Map<Language, TranslationData> = new Map();

// 默认语言
const DEFAULT_LANGUAGE: Language = "zh-CN";

// 支持的语言列表
const SUPPORTED_LANGUAGES: Language[] = ["zh-CN", "en-US", "ja-JP"];

/**
 * 加载翻译文件
 * @param language 语言代码
 * @returns 翻译数据
 */
function loadTranslations(language: Language): TranslationData {
  // 检查缓存
  const cached = translationCache.get(language);
  if (cached) {
    return cached;
  }

  try {
    // 在开发环境中，翻译文件在源码目录中
    const isDevelopment = process.env.NODE_ENV === "development";
    const translationPath = isDevelopment
      ? path.join(
          process.cwd(),
          "src",
          "utils",
          "i18n",
          "locales",
          `${language}.json`
        )
      : path.join(__dirname, "locales", `${language}.json`);

    if (!fs.existsSync(translationPath)) {
      return {};
    }

    const fileContent = fs.readFileSync(translationPath, "utf-8");
    const translationData = JSON.parse(fileContent) as TranslationData;

    // 缓存翻译数据
    translationCache.set(language, translationData);
    return translationData;
  } catch (_error) {
    return {};
  }
}

/**
 * 从嵌套对象中获取值
 * @param obj 对象
 * @param keyPath 键路径，用点分隔
 * @returns 值
 */
function getNestedValue(obj: any, keyPath: string): string | undefined {
  if (!obj || !keyPath) {
    return undefined;
  }

  return keyPath.split(".").reduce((current: any, key: string) => {
    if (current && typeof current === "object" && key in current) {
      return current[key];
    }
    return undefined;
  }, obj);
}

/**
 * 翻译函数
 * @param key 翻译键，支持嵌套路径如 'user.login.success'
 * @param params 参数对象，用于替换占位符
 * @param language 语言代码，可选
 * @returns 翻译后的文本
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  language?: Language
): string {
  // 使用传入的语言或默认语言
  const targetLanguage =
    language || (KEY.language as Language) || DEFAULT_LANGUAGE;

  // 验证语言支持
  if (!SUPPORTED_LANGUAGES.includes(targetLanguage)) {
    return key;
  }

  // 加载翻译数据
  const translations = loadTranslations(targetLanguage);

  // 获取翻译文本
  let translation = getNestedValue(translations, key) as string;

  // 如果找不到翻译，尝试使用默认语言
  if (!translation && targetLanguage !== DEFAULT_LANGUAGE) {
    const defaultTranslations = loadTranslations(DEFAULT_LANGUAGE);
    translation = getNestedValue(defaultTranslations, key) as string;
  }

  // 如果还是找不到翻译，返回键名
  if (!translation) {
    return key;
  }

  // 替换参数占位符
  if (params && Object.keys(params).length > 0) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      const placeholder = `{{${paramKey}}}`;
      const regex = new RegExp(
        placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      translation = translation.replace(regex, String(paramValue));
    });
  }

  return translation;
}

/**
 * 设置默认语言
 * @param language 语言代码，可选
 */
export function setDefaultLanguage(language?: Language): void {
  const targetLanguage = language || (KEY.language as Language);

  if (!targetLanguage || !SUPPORTED_LANGUAGES.includes(targetLanguage)) {
    throw ErrorFactory.validation(`Unsupported language: ${targetLanguage}`);
  }

  // 预加载翻译数据
  loadTranslations(targetLanguage);
}

/**
 * 获取支持的语言列表
 * @returns 支持的语言数组
 */
export function getSupportedLanguages(): Language[] {
  return [...SUPPORTED_LANGUAGES];
}

/**
 * 清除翻译缓存
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * 重新加载翻译文件
 * @param language 语言代码，可选，不传则重新加载所有语言
 */
export function reloadTranslations(language?: Language): void {
  if (language) {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw ErrorFactory.validation(`Unsupported language: ${language}`);
    }
    translationCache.delete(language);
    loadTranslations(language);
  } else {
    translationCache.clear();
    SUPPORTED_LANGUAGES.forEach(lang => {
      try {
        loadTranslations(lang);
      } catch (_error) {
        // 忽略单个语言加载失败
      }
    });
  }
}

// 导出默认翻译函数
export default t;
