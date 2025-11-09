# QuickMark

**极简个人书签管理工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)

## ✨ 特性

- **智能管理** - 自动获取网站标题和图标
- **即时搜索** - 实时搜索书签标题和 URL
- **响应式设计** - 完美适配手机、平板和桌面端
- **安全架构** - API 网关模式，数据库完全私有

## 🚀 快速开始

### 1. 创建 Supabase 数据库

1. 访问 [supabase.com](https://supabase.com) 创建项目
2. 在 SQL 编辑器中执行：

```sql
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  user_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service access only" ON bookmarks
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

### 2. 安装项目

```bash
git clone https://github.com/Eyozy/quickmark.git
cd quickmark
npm install
```

### 3. 本地运行

配置本地环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
ADMIN_PASSWORD=your_secure_admin_password
```

### 4. 启动开发服务器

```bash
npm run dev
```

- **首页**：[http://localhost:3000](http://localhost:3000) - 公开访问
- **管理后台**：[http://localhost:3000/admin](http://localhost:3000) - 需要密码

## 🛠️ 部署

### Vercel 部署（推荐）

1. 推送代码到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_PASSWORD`

## 🔒 安全架构

- **数据库私有** - 严格 RLS 策略，禁止直接访问
- **API 网关** - 所有数据操作通过服务端代理
- **密码保护** - 管理后台需要环境变量密码验证
- **IP 限流** - 密码错误 3 次，IP 禁用 3 小时

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。