import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 验证 URL 格式
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // 设置请求头，模拟浏览器访问
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // 获取网页内容
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 提取标题
    let title = $('title').first().text().trim();
    if (!title) {
      title = $('meta[property="og:title"]').attr('content') || '';
    }
    if (!title) {
      title = $('meta[name="twitter:title"]').attr('content') || '';
    }

    // 提取描述
    let description = $('meta[name="description"]').attr('content') || '';
    if (!description) {
      description = $('meta[property="og:description"]').attr('content') || '';
    }
    if (!description) {
      description = $('meta[name="twitter:description"]').attr('content') || '';
    }

    // 清理描述文本
    if (description) {
      description = description.trim().substring(0, 200); // 限制长度
    }

    // 使用 favicon.im 服务获取图标
    let favicon = '';

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // 使用 favicon.im 服务获取图标
      // 格式: https://favicon.im/google.com
      favicon = `https://favicon.im/${domain}`;

      // 如果是 localhost 或 IP 地址，使用特殊处理
      if (domain === 'localhost' || domain === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
        favicon = '';
      }

    } catch (error) {
      console.error('Favicon generation error:', error);
      favicon = '';
    }

    // 如果没有获取到标题，使用域名作为标题
    if (!title) {
      const urlObj = new URL(url);
      title = urlObj.hostname;
    }

    return NextResponse.json({
      title: title || 'Unknown Title',
      description: description || '',
      favicon: favicon || '',
      url: url
    });

  } catch (error) {
    console.error('Metadata fetch error:', error);

    let errorMessage = 'Failed to fetch metadata';
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to access the URL';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
}