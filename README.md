# QuickMark

**一个极简、优雅的个人书签管理工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)

## ✨ 特性

### 🎯 核心功能
- **智能书签管理** - 自动获取网站标题和图标
- **即时搜索** - 实时搜索书签标题和 URL
- **安全架构** - API 网关模式，隐藏数据库直接访问
- **响应式设计** - 完美适配手机、平板和桌面端

### 🛠️ 技术特性
- **现代技术栈** - Next.js 16 + React 19 + Tailwind CSS 4
- **类型安全** - 完整的 TypeScript 支持
- **安全数据库** - Supabase 后端 + RLS 行级安全
- **API 网关** - 服务端代理，防止数据库密钥泄露
- **图标服务** - 自动获取网站 favicon

### 🎨 用户体验
- **极简美学** - 简洁优雅的界面设计
- **快速响应** - 毫秒级搜索体验
- **密码保护** - 管理后台需要环境变量密码验证
- **智能布局** - 自适应不同屏幕尺寸

### 🔒 安全特性
- **数据库完全私有** - 严格 RLS 策略，禁止任何直接访问
- **API 网关模式** - 所有数据操作通过服务端代理
- **IP 限流保护** - 密码错误 3 次，IP 禁用 3 小时
- **密码保护后台** - 管理界面需要环境变量密码验证

## 🚀 快速开始

### 第一步：创建 Supabase 数据库

1. **注册 Supabase**
   - 访问 [supabase.com](https://supabase.com) 注册账户
   - 创建新项目，记住项目 URL 和 API 密钥

2. **创建书签表和安全策略**

   在 Supabase Dashboard 的 SQL 编辑器中，**复制粘贴以下全部代码并执行**：

```sql
-- 创建书签表
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  user_id VARCHAR(50) DEFAULT 'default-user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- 🔒 启用严格 RLS 安全保护
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Public read access" ON bookmarks;
DROP POLICY IF EXISTS "Admin write access" ON bookmarks;

-- 严格策略：禁止所有直接数据库访问
CREATE POLICY "No direct access" ON bookmarks
    FOR ALL
    USING (false) -- 拒绝所有直接访问
    WITH CHECK (false); -- 拒绝所有直接插入/更新
```

⚠️ **执行完 SQL 后，数据库就完全私有化了！**

### 第二步：安装和配置项目

1. **克隆项目**
```bash
git clone https://github.com/Eyozy/quickmark.git
cd quickmark
```

2. **安装依赖**
```bash
npm install
```

3. **环境变量配置**

复制示例文件：
```bash
cp .env.local.example .env.local
```

然后编辑 `.env.local` 文件，填入你在 Supabase 获得的信息：
```env
# Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
# Supabase 匿名密钥
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# 管理后台密码（请设置强密码）
ADMIN_PASSWORD=your_secure_admin_password_here
```

### 第三步：启动项目

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看你的网站！

- **首页**：访问 [http://localhost:3000](http://localhost:3000) 查看书签（公开访问）
- **管理后台**：访问 [http://localhost:3000/admin](http://localhost:3000) 添加/删除书签（需要密码）
- **安全测试**：密码错误 3 次后 IP 将被禁用 3 小时

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
├── public/                     # 静态资源
│   └── favicon.svg             # 网站图标
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # 管理后台页面（密码+IP限流保护）
│   │   ├── api/                # API 路由
│   │   │   ├── auth/           # 简单密码验证（含IP限流）
│   │   │   ├── bookmarks/      # 书签API网关（唯一数据入口）
│   │   │   └── fetch-metadata/ # 网站元数据获取
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 首页（公开访问）
│   ├── components/             # React 组件
│   │   └── SimpleAdminAuth.tsx # 管理员验证界面
│   └── lib/                    # 工具库
│       ├── api-client.ts       # API客户端（前端数据接口）
│       ├── constants.ts        # 常量配置
│       └── favicon-utils.ts    # 图标处理工具
├── package.json                # 项目依赖
├── next.config.ts              # Next.js 配置
├── tailwind.config.ts          # Tailwind 配置
└── README.md                   # 项目文档（含完整SQL配置）
```

### 🔐 极简安全架构

QuickMark 使用 **严格 API 网关模式** 实现数据库完全私有：

1. **数据库完全隔离**
   - 启用严格 RLS 策略：`USING (false)` 拒绝所有直接访问
   - 任何人都无法直接连接数据库，包括你在 Supabase Dashboard

2. **单一数据入口**
   - `/api/bookmarks` 是唯一的数据操作接口
   - 使用服务端 Supabase 密钥，前端无法获取数据库连接

3. **IP 限流保护**
   - 密码错误 3 次自动禁用 IP 3 小时
   - 使用内存存储，适合个人项目

4. **极简认证**
   - 环境变量密码验证
   - 无 JWT、无 Session、无复杂状态管理

### ⚙️ 自定义配置

#### API 密钥说明
`src/lib/api-client.ts` 中的 API 密钥：
```typescript
const API_KEY = 'quickmark-secure-api-2024';
```

**这个密钥的作用：**
- 前端和后端 API 之间的通信密码
- 防止陌生人直接调用你的 API 接口
- **可以随意修改**，不影响数据库安全

## 🚀 部署指南

### Vercel 部署（推荐）

1. **连接 GitHub**
   - 将代码推送到 GitHub 仓库
   - 在 [Vercel](https://vercel.com) 导入项目

2. **配置环境变量**
   在 Vercel 控制台中添加以下环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ADMIN_PASSWORD=your_production_admin_password
   ```

3. **自动部署**
   - 推送代码自动触发部署
   - 部署完成后测试首页和管理后台功能

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。
