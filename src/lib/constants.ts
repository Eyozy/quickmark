/**
 * QuickMark 应用常量配置
 * 集中管理应用中使用的所有常量
 */

// ===== 用户相关 =====
// MVP 版本使用的默认用户 ID (UUID 格式)
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// ===== 应用配置 =====
export const APP_CONFIG = {
  name: 'QuickMark',
  description: '个人极简书签中心',
  version: '1.0.0',
  author: 'QuickMark Team'
} as const;

// ===== UI 配置 =====
export const UI_CONFIG = {
  // 消息提示配置
  message: {
    autoHideDelay: 3000, // 3 秒后自动隐藏
    maxMessages: 5 // 最大同时显示消息数
  },
  // 搜索配置
  search: {
    minLength: 1, // 最小搜索长度
    debounceDelay: 300 // 搜索防抖延迟 (ms)
  },
  // 分页配置
  pagination: {
    pageSize: 20 // 每页显示数量
  }
} as const;

// ===== API 配置 =====
export const API_CONFIG = {
  endpoints: {
    fetchMetadata: '/api/fetch-metadata',
    authVerify: '/api/auth/verify-admin'
  },
  timeout: {
    default: 10000, // 10 秒默认超时
    metadata: 15000 // 15 秒元数据获取超时
  }
} as const;

// ===== 错误消息 =====
export const ERROR_MESSAGES = {
  network: '网络连接失败，请检查网络设置',
  database: '数据库连接失败，请稍后重试',
  validation: {
    url: '请输入有效的网址',
    required: '此字段为必填项'
  },
  auth: {
    unauthorized: '未授权访问',
    invalidCredentials: '用户名或密码错误'
  }
} as const;

// ===== 成功消息 =====
export const SUCCESS_MESSAGES = {
  bookmarkAdded: '书签添加成功！',
  bookmarkDeleted: '书签删除成功！',
  databaseConnected: '数据库连接成功！'
} as const;

// ===== 正则表达式 =====
export const REGEX_PATTERNS = {
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
} as const;

// ===== 本地存储键名 =====
export const STORAGE_KEYS = {
  adminAuth: 'admin-auth',
  userPreferences: 'user-preferences',
  lastVisit: 'last-visit'
} as const;