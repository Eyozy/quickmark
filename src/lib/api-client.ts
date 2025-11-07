// API 客户端 - 替代直接的 Supabase 客户端
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-domain.com'
  : 'http://localhost:3000';

const API_KEY = 'quickmark-secure-api-2025';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  created_at?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// 获取书签列表
export async function getBookmarks(search?: string, limit?: number): Promise<Bookmark[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/api/bookmarks?${params}`, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Bookmark[]> = await response.json();

    if (!result.success) {
      throw new Error(result.error || '获取书签失败');
    }

    return result.data || [];
  } catch (error) {
    console.error('获取书签失败：', error);
    // 返回空数组作为后备
    return [];
  }
}

// 添加书签
export async function addBookmark(bookmark: {
  title: string;
  url: string;
  description?: string;
  favicon?: string;
}): Promise<Bookmark> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookmark),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<Bookmark> = await response.json();

    if (!result.success) {
      throw new Error(result.error || '添加书签失败');
    }

    return result.data!;
  } catch (error) {
    console.error('添加书签失败：', error);
    throw error;
  }
}

// 删除书签
export async function deleteBookmark(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks?id=${id}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || '删除书签失败');
    }
  } catch (error) {
    console.error('删除书签失败：', error);
    throw error;
  }
}

// 获取网站元数据
export async function fetchMetadata(url: string): Promise<{
  title: string;
  description: string;
  favicon: string;
  url: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/fetch-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('获取元数据失败：', error);
    throw error;
  }
}