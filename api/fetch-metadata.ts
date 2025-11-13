import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const text = await response.text();

    // 获取标题 - 更健壮的匹配
    let title = '';
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // 如果没有找到 title 标签，尝试从 meta 标签获取
      const ogTitleMatch = text.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      const twitterTitleMatch = text.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      title = ogTitleMatch?.[1]?.trim() || twitterTitleMatch?.[1]?.trim() || '';
    }

    // 如果还是没有找到 title，使用域名作为标题
    if (!title) {
      try {
        title = new URL(url).hostname;
      } catch {
        title = '未命名网站';
      }
    }

    // 获取描述 - 支持多种格式
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

    // 获取 favicon
    let favicon = '';

    // 1. 标准 favicon
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

  } catch (error) {
    console.warn('获取网站信息失败，使用默认信息：', error);

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
}