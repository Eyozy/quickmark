import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const API_KEY = 'quickmark-secure-api-2025';

const supabase = createClient(supabaseUrl, supabaseKey);

function verifyApiKey(req: VercelRequest, res: VercelResponse) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    res.status(401).json({ error: '未授权访问' });
    return false;
  }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!verifyApiKey(req, res)) {
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res);
        break;
      case 'POST':
        await handlePost(req, res);
        break;
      case 'PUT':
        await handlePut(req, res);
        break;
      case 'DELETE':
        await handleDelete(req, res);
        break;
      default:
        res.status(405).json({ error: '方法不允许' });
    }
  } catch (error) {
    console.error('API 错误：', error);
    res.status(500).json({ error: '服务器错误' });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const { search, limit = 100 } = req.query;

  let query = supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limit as string));

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
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const { title, url, description, favicon } = req.body;

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
    data: data![0],
    message: '书签添加成功'
  });
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
  const { id, title, url, description, favicon } = req.body;

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
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
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
}