# QuickMark

**一个极简、优雅的个人书签管理工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)

## ✨ 特性

### 🎯 核心功能
- **智能书签管理** - 自动获取网站标题和图标
- **即时搜索** - 实时搜索书签标题和 URL
- **批量操作** - 选择多个书签进行批量删除
- **响应式设计** - 完美适配手机、平板和桌面端

### 🛠️ 技术特性
- **现代技术栈** - Next.js 16 + React 19 + Tailwind CSS 4
- **类型安全** - 完整的 TypeScript 支持
- **数据库支持** - Supabase 后端，免费易用
- **图标服务** - 自动获取网站 favicon

### 🎨 用户体验
- **极简美学** - 简洁优雅的界面设计
- **快速响应** - 毫秒级搜索体验
- **无缝编辑** - 内联编辑书签信息
- **智能布局** - 自适应不同屏幕尺寸

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/quickmark.git
cd quickmark
```

2. **安装依赖**
```bash
npm install
```

3. **环境变量配置**

创建 `.env.local` 文件：
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 管理员密码
ADMIN_PASSWORD=your_admin_password
```

4. **数据库设置**

在 Supabase 中创建 `bookmarks` 表：
```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- MVP 版本：禁用 RLS
ALTER TABLE bookmarks DISABLE ROW LEVEL SECURITY;
```

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
- 打开 [http://localhost:3000](http://localhost:3000) 访问首页
- 访问 [http://localhost:3000/admin](http://localhost:3000/admin) 进入管理后台

### 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### 目录结构

```
quickmark/
├── public/                 # 静态资源
│   └── favicon.svg        # 网站图标
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── admin/        # 管理后台页面
│   │   ├── api/          # API 路由
│   │   │   ├── auth/     # 身份验证
│   │   │   ├── fetch-metadata/ # 获取网站元数据
│   │   │   └── ...       # 其他API
│   │   ├── globals.css   # 全局样式
│   │   ├── layout.tsx    # 根布局
│   │   └── page.tsx      # 首页
│   ├── components/       # React 组件
│   │   └── AdminAuth.tsx # 管理员身份验证
│   └── lib/             # 工具库
│       ├── constants.ts  # 常量配置
│       ├── favicon-utils.ts # 图标处理
│       ├── supabaseClient.ts # 数据库客户端
│       └── ...
├── package.json          # 项目依赖
├── next.config.ts        # Next.js 配置
├── tailwind.config.ts    # Tailwind 配置
└── README.md            # 项目文档
```

## 🔧 配置选项

### 环境变量

| 变量名 | 描述 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅ |
| `ADMIN_PASSWORD` | 管理后台密码 | ✅ |

### 自定义配置

编辑 `src/lib/constants.ts` 文件：

```typescript
// 用户配置
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// UI 配置
export const UI_CONFIG = {
  message: {
    autoHideDelay: 3000,  // 消息自动隐藏时间
    maxMessages: 5         // 最大同时显示消息数
  },
  search: {
    minLength: 1,          // 最小搜索长度
    debounceDelay: 300     // 搜索防抖延迟
  }
};
```

## 🚀 部署指南

### Vercel 部署（推荐）

1. **连接 GitHub**
   - 将代码推送到 GitHub 仓库
   - 在 [Vercel](https://vercel.com) 导入项目

2. **配置环境变量**
   - 在 Vercel 控制台添加环境变量
   - 确保 `NEXT_PUBLIC_*` 前缀正确

3. **自动部署**
   - 推送代码自动触发部署
   - 分支预览和主分支部署

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。
