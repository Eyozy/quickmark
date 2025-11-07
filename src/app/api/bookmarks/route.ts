import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 使用服务端密钥（不暴露给前端）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 创建服务端客户端
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('缺少必需的 Supabase 环境变量');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// API 密钥验证（简单版本）
const API_KEY = 'quickmark-secure-api-2025';

function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  return apiKey === API_KEY;
}

// 获取书签列表
export async function GET(request: NextRequest) {
  try {
    // 验证 API 密钥
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // 如果有搜索条件，添加搜索
    if (search) {
      query = query.or(`title.ilike.%${search}%,url.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取书签失败：', error);
      return NextResponse.json({ error: '获取书签失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('API 错误：', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 添加书签
export async function POST(request: NextRequest) {
  try {
    // 验证 API 密钥
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { title, url, description, favicon } = await request.json();

    // 验证必需字段
    if (!title || !url) {
      return NextResponse.json({ error: '标题和 URL 是必需的' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{
        title: title.trim(),
        url: url.trim(),
        description: description?.trim() || '',
        favicon: favicon || '',
        user_id: 'default-user',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('添加书签失败：', error);
      return NextResponse.json({ error: '添加书签失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: '书签添加成功'
    });

  } catch (error) {
    console.error('API 错误：', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除书签
export async function DELETE(request: NextRequest) {
  try {
    // 验证 API 密钥
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '书签 ID 是必需的' }, { status: 400 });
    }

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除书签失败：', error);
      return NextResponse.json({ error: '删除书签失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '书签删除成功'
    });

  } catch (error) {
    console.error('API 错误：', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}