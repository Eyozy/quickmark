# QuickMark

**极简个人书签管理工具** - 基于 Vite + React + Supabase

## ✨ 特性

### 🎯 核心功能
- **智能书签管理** - 自动获取网站标题、描述和图标
- **实时搜索** - 即时搜索书签标题、URL 和描述
- **响应式设计** - 完美适配手机、平板和桌面端
- **现代化界面** - 采用 Tailwind CSS 设计，支持深色模式

### 🔧 管理功能
- **批量操作** - 支持批量选择、删除书签
- **导入导出** - 支持 JSON、CSV、HTML 格式的书签导入导出
- **双视图模式** - 卡片视图和表格视图自适应切换
- **编辑功能** - 在线编辑书签信息

### 🛡️ 安全特性
- **API 密钥认证** - 使用安全密钥保护 API 访问
- **管理员认证** - 密码保护的管理后台
- **CORS 保护** - 跨域请求安全控制
- **数据验证** - 严格的输入验证和错误处理

## 📁 项目结构

```
quickmark/
├── src/
│   ├── pages/                 # 页面组件
│   │   ├── Home.tsx           # 首页 - 书签展示和搜索
│   │   └── Admin.tsx          # 管理后台 - CRUD 操作
│   ├── components/            # 可复用组件
│   │   └── FaviconIcon.tsx    # 网站图标组件
│   ├── lib/                   # 工具函数
│   │   ├── api-client.ts      # API 客户端
│   │   └── favicon-utils.ts   # Favicon 工具函数
│   ├── App.tsx                # 应用根组件
│   ├── main.tsx               # 应用入口
│   └── index.css              # 全局样式
├── api/                       # Vercel Serverless Functions
│   ├── bookmarks.ts           # 书签 CRUD API
│   ├── auth/simple-login.ts   # 管理员认证
│   └── fetch-metadata.ts      # 网站元数据获取
├── public/                    # 静态资源
├── vercel.json                # Vercel 部署配置
├── vite.config.ts             # Vite 配置
└── package.json               # 项目依赖
```

## 🏃‍♂️ 快速开始

### 1. 环境准备

确保你已经安装：
- Node.js 18+
- npm 或 yarn
- Git

### 2. 克隆项目

```bash
git clone https://github.com/Eyozy/quickmark.git
cd quickmark-vite
npm install
```

### 3. 配置环境变量

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件：

```env
# Supabase 配置
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key

# 管理员密码
ADMIN_PASSWORD=your_secure_admin_password
```

### 4. 创建数据库

在 [Supabase Dashboard](https://supabase.com/dashboard) 的 SQL 编辑器中执行：

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

### 5. 启动开发服务器

```bash
# 启动前端开发服务器（端口 5173）
npm run dev

# 或者同时启动 API 服务器（本地开发用）
npm run dev:full
```

访问应用：
- **首页**：[http://localhost:5173](http://localhost:5173) - 公开访问
- **管理后台**：[http://localhost:5173/admin](http://localhost:5173/admin) - 需要密码

## 🚀 部署

### Vercel 部署（推荐）

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "feat: initial commit"
   git push origin main
   ```

2. **在 Vercel 导入项目**
   - 访问 [vercel.com](https://vercel.com)
   - 导入 GitHub 仓库
   - Vercel 会自动检测 Vite 项目

3. **配置环境变量**
   在 Vercel Dashboard → Project Settings → Environment Variables 中添加：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ADMIN_PASSWORD=your_secure_admin_password
   ```

4. **自动部署**
   推送代码后会自动触发部署

### 本地部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。