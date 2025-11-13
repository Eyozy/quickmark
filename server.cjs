const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少必需的 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API 密钥验证
const API_KEY = 'quickmark-secure-api-2025';

function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(401).json({ error: '未授权访问' });
  }
  next();
}

// 管理员密码验证
function verifyAdminPassword(req, res, next) {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密码错误' });
  }
  next();
}

// 书签路由
app.get('/api/bookmarks', verifyApiKey, async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;

    let query = supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // 如果有搜索条件，添加搜索
    if (search) {
      query = query.or(`title.ilike.%${search}%,url.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取书签失败：', error);
      return res.status(500).json({ error: '获取书签失败' });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('API 错误：', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/bookmarks', verifyApiKey, async (req, res) => {
  try {
    const { title, url, description, favicon } = req.body;

    // 验证必需字段
    if (!title || !url) {
      return res.status(400).json({ error: '标题和 URL 是必需的' });
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{
        title: title.trim(),
        url: url.trim(),
        description: description?.trim() || '',
        favicon: favicon || '',
        user_id: randomUUID(),
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('添加书签失败：', error);
      return res.status(500).json({ error: '添加书签失败' });
    }

    res.json({
      success: true,
      data: data[0],
      message: '书签添加成功'
    });

  } catch (error) {
    console.error('API 错误：', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.put('/api/bookmarks', verifyApiKey, async (req, res) => {
  try {
    const { id, title, url, description, favicon } = req.body;

    // 验证必需字段
    if (!id || !title || !url) {
      return res.status(400).json({ error: 'ID、标题和 URL 是必需的' });
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .update({
        title: title.trim(),
        url: url.trim(),
        description: description?.trim() || '',
        favicon: favicon || ''
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('更新书签失败：', error);
      return res.status(500).json({ error: '更新书签失败' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: '书签不存在' });
    }

    res.json({
      success: true,
      data: data[0],
      message: '书签更新成功'
    });

  } catch (error) {
    console.error('API 错误：', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

app.delete('/api/bookmarks', verifyApiKey, async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '书签 ID 是必需的' });
    }

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除书签失败：', error);
      return res.status(500).json({ error: '删除书签失败' });
    }

    res.json({
      success: true,
      message: '书签删除成功'
    });

  } catch (error) {
    console.error('API 错误：', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 认证路由
app.post('/api/auth/simple-login', verifyAdminPassword, (req, res) => {
  res.json({ success: true, message: '认证成功' });
});

// 获取网站元数据
app.post('/api/fetch-metadata', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL 是必需的' });
    }

    try {
      // 设置请求头，模拟真实浏览器访问
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };

      const response = await fetch(url, { headers, timeout: 10000 });
      const text = await response.text();

      // 获取标题 - 更健壮的匹配
      let title = '';
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      } else {
        // 如果没有找到title标签，尝试从meta标签获取
        const ogTitleMatch = text.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        const twitterTitleMatch = text.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        title = ogTitleMatch?.[1]?.trim() || twitterTitleMatch?.[1]?.trim() || '';
      }

      // 如果还是没有找到title，使用域名作为标题
      if (!title) {
        try {
          title = new URL(url).hostname;
        } catch {
          title = '未命名网站';
        }
      }

      // 获取描述 - 支持多种非标准格式
      let description = '';

      // 1. 标准 description meta 标签
      const descMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }

      // 2. Open Graph description
      if (!description) {
        const ogDescMatch = text.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (ogDescMatch) {
          description = ogDescMatch[1].trim();
        }
      }

      // 3. Twitter description
      if (!description) {
        const twitterDescMatch = text.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (twitterDescMatch) {
          description = twitterDescMatch[1].trim();
        }
      }

      // 4. 一些网站使用的非标准格式
      if (!description) {
        const nonStandardMatches = [
          // 有些网站使用 name="Description"
          text.match(/<meta[^>]*name=["']Description["'][^>]*content=["']([^"']+)["'][^>]*>/i),
          // 有些网站使用 property="description"
          text.match(/<meta[^>]*property=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i),
          // 有些网站使用 itemprop="description"
          text.match(/<meta[^>]*itemprop=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i),
          // 一些网站可能有反引号包围的content
          text.match(/<meta[^>]*name=["']description["'][^>]*content=`([^'`]+)`/i)
        ];

        for (const match of nonStandardMatches) {
          if (match && match[1]) {
            description = match[1].trim();
            break;
          }
        }
      }

      // 5. 尝试从页面内容中提取第一句话作为备选
      if (!description) {
        // 查找第一个p标签的内容
        const pTagMatch = text.match(/<p[^>]*>([^<]{50,200})<\/p>/i);
        if (pTagMatch) {
          description = pTagMatch[1].trim().replace(/\s+/g, ' ');
          // 截取过长的描述
          if (description.length > 150) {
            description = description.substring(0, 150) + '...';
          }
        }
      }

      // 获取favicon
      let favicon = '';

      // 1. 标准favicon
      const faviconMatch = text.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["'][^>]*>/i);
      if (faviconMatch) {
        favicon = faviconMatch[1].trim();
      }

      // 2. 如果是相对路径，转换为绝对路径
      if (favicon && !favicon.startsWith('http')) {
        try {
          const baseUrl = new URL(url);
          favicon = new URL(favicon, baseUrl).href;
        } catch {
          favicon = '';
        }
      }

      // 3. 如果没找到，尝试默认路径
      if (!favicon) {
        try {
          const baseUrl = new URL(url);
          favicon = `${baseUrl.origin}/favicon.ico`;
        } catch {
          favicon = '';
        }
      }

      res.json({
        success: true,
        data: {
          title,
          description,
          favicon,
          url
        }
      });

    } catch (fetchError) {
      console.warn('获取网站信息失败，使用默认信息：', fetchError.message);

      // 如果获取失败，返回基本信息
      let title = '未命名网站';
      try {
        title = new URL(url).hostname;
      } catch {
        title = '未命名网站';
      }

      res.json({
        success: true,
        data: {
          title,
          description: '',
          favicon: '',
          url
        }
      });
    }

  } catch (error) {
    console.error('获取元数据失败：', error);
    res.status(500).json({ error: '获取元数据失败' });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`API 服务器运行在 http://localhost:${PORT}`);
});

module.exports = app;