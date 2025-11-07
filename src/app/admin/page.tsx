"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Upload,
  Download,
  Trash2,
  CheckSquare,
  Square,
  Edit2,
  Save,
  X,
  FolderOpen,
  Settings,
  ExternalLink,
  Search,
  Grid3X3,
  List
} from "lucide-react";
import SimpleAdminAuth from '@/components/SimpleAdminAuth';
import {
  STORAGE_KEYS,
  API_CONFIG
} from '@/lib/constants';
import { getBookmarks, addBookmark, deleteBookmark } from '@/lib/api-client';
import { getFaviconUrl, getFaviconFallback, getFaviconInfo } from '@/lib/favicon-utils';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  created_at?: string;
}

interface EditingBookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
}

// 图标组件
const FaviconIcon = ({ url, favicon, title, size = 8 }: {
  url: string;
  favicon?: string;
  title: string;
  size?: number;
}) => {
  const faviconInfo = getFaviconInfo(url, favicon);
  const iconSize = size === 8 ? 'w-5 h-5' : size === 10 ? 'w-6 h-6' : 'w-8 h-8';
  const containerSize = `w-${size} h-${size}`;
  const fontSize = size === 8 ? 'text-xs' : size === 10 ? 'text-sm' : 'text-base';

  if (faviconInfo.hasValidFavicon && faviconInfo.url) {
    return (
      <div className={`${containerSize} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <img
          src={faviconInfo.url}
          alt={`${title} favicon`}
          className={iconSize}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-gray-400 ${fontSize} font-medium">${getFaviconFallback(url)}</span>`;
            }
          }}
          onLoad={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'block';
          }}
        />
      </div>
    );
  }

  // 显示首字母
  return (
    <div className={`${containerSize} bg-gray-100 rounded-lg flex items-center justify-center`}>
      <span className={`text-gray-400 ${fontSize} font-medium`}>
        {getFaviconFallback(url)}
      </span>
    </div>
  );
};

export default function AdminPage() {
  // 身份验证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 表单状态管理
  const [url, setUrl] = useState(""); // 添加书签的 URL 输入
  const [customTitle, setCustomTitle] = useState(""); // 自定义标题输入
  const [showTitleInput, setShowTitleInput] = useState(false); // 是否显示自定义标题输入框
  const [fetchedMetadata, setFetchedMetadata] = useState<any>(null); // 获取到的网站元数据
  const [searchQuery, setSearchQuery] = useState(""); // 搜索关键词

  // 加载状态管理
  const [isLoading, setIsLoading] = useState(false); // 添加书签时的加载状态
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(false); // 加载书签列表的状态
  const [isDeleting, setIsDeleting] = useState(false); // 删除时的加载状态

  // 数据和 UI 状态
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]); // 书签列表
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set()); // 选中的书签 ID
  const [editingBookmark, setEditingBookmark] = useState<EditingBookmark | null>(null); // 正在编辑的书签
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table'); // 视图模式
  const [message, setMessage] = useState(""); // 消息提示内容
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info"); // 消息提示类型

  // ===== 生命周期钩子 =====

  /**
   * 组件挂载时检查身份验证状态
   * 如果已登录，自动加载书签列表
   */
  useEffect(() => {
    const authStatus = sessionStorage.getItem(STORAGE_KEYS.adminAuth);
    if (authStatus === "true") {
      setIsAuthenticated(true);
      loadBookmarks();
    }
  }, []);

  /**
   * 响应式处理：根据屏幕宽度设置视图模式
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('card');
      } else {
        setViewMode('table');
      }
    };

    // 初始设置
    handleResize();

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * 消息提示自动消失效果
   * 3 秒后自动清除消息提示
   */
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("info");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // ===== 辅助函数 =====

  /**
   * 统一的消息提示函数
   */
  const setAutoMessage = (msg: string, type: "success" | "error" | "info" = "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  /**
   * 处理身份验证成功的回调
   */
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    loadBookmarks();
  };

  // ===== 数据获取函数 =====

  /**
   * 从 API 加载书签列表
   */
  const loadBookmarks = async () => {
    setIsLoadingBookmarks(true);
    try {
      const data = await getBookmarks();
      setBookmarks(data);
    } catch (error) {
      setAutoMessage('❌ 加载书签列表出错', 'error');
    } finally {
      setIsLoadingBookmarks(false);
    }
  };

  // ===== 事件处理函数 =====

  /**
   * 添加新书签的处理函数（完整版，支持获取元数据）
   */
  const handleAddBookmark = async () => {
    if (!url) {
      setAutoMessage('请输入网址', 'error');
      return;
    }

    setIsLoading(true);
    setAutoMessage('正在获取网站信息...', 'info');

    try {
      // 获取网站元数据
      let title = customTitle;
      let favicon = '';
      let description = '';

      // 如果没有自定义标题，尝试获取网站元数据
      if (!title) {
        try {
          const response = await fetch(API_CONFIG.endpoints.fetchMetadata, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (response.ok) {
            const metadata = await response.json();
            title = metadata.title;
            favicon = metadata.favicon;
            description = metadata.description;
          } else {
            // 如果获取失败，使用 URL 作为标题
            console.warn('获取网站元数据失败，使用 URL 作为标题');
            title = url;
          }
        } catch (error) {
          console.warn('获取网站元数据出错，使用 URL 作为标题：', error);
          title = url;
        }
      }

      // 如果还是没有标题，使用 URL
      if (!title) {
        title = url;
      }

      // 保存到数据库
      await addBookmark({
        title: title,
        url: url,
        description: description,
        favicon: favicon
      });

      // 成功处理
      setAutoMessage('✅ 书签添加成功！', 'success');

      // 重置表单状态
      setUrl('');
      setCustomTitle('');
      setShowTitleInput(false);

      // 刷新书签列表
      loadBookmarks();

    } catch (error) {
      setAutoMessage('❌ 添加书签失败：' + (error instanceof Error ? error.message : '未知错误'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 切换书签选择状态
   */
  const toggleBookmarkSelection = (id: string) => {
    const newSelection = new Set(selectedBookmarks);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedBookmarks(newSelection);
  };

  /**
   * 切换全选状态
   */
  const toggleSelectAll = () => {
    if (selectedBookmarks.size === filteredBookmarks.length) {
      setSelectedBookmarks(new Set());
    } else {
      setSelectedBookmarks(new Set(filteredBookmarks.map(b => b.id)));
    }
  };

  /**
   * 删除选中的书签
   */
  const deleteSelectedBookmarks = async () => {
    if (selectedBookmarks.size === 0) {
      setAutoMessage('请先选择要删除的书签', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      // 批量删除书签
      for (const id of Array.from(selectedBookmarks)) {
        await deleteBookmark(id);
      }

      setAutoMessage(`✅ 已删除 ${selectedBookmarks.size} 个书签`, 'success');
      setSelectedBookmarks(new Set());
      loadBookmarks();

    } catch (error) {
      setAutoMessage('❌ 删除失败：' + (error instanceof Error ? error.message : '未知错误'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 注意：编辑功能暂时禁用，因为当前 API 不支持更新操作
  const startEditing = (_bookmark: Bookmark) => {
    setAutoMessage('⚠️ 编辑功能暂时禁用，请删除后重新添加', 'info');
  };
  const saveEdit = () => {};
  const cancelEdit = () => {};

  // ===== 数据处理 =====

  /**
   * 搜索过滤书签
   */
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks;

    const query = searchQuery.toLowerCase();
    return bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url.toLowerCase().includes(query) ||
      (bookmark.description && bookmark.description.toLowerCase().includes(query))
    );
  }, [bookmarks, searchQuery]);

  // 渲染卡片视图组件（1024px 以下专用布局）
  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      {filteredBookmarks.map((bookmark) => (
        <div key={bookmark.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          {/* 顶部：选择框和操作按钮 */}
          <div className="flex items-start justify-between mb-3">
            <button
              onClick={() => toggleBookmarkSelection(bookmark.id)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              {selectedBookmarks.has(bookmark.id) ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <div className="flex space-x-2">
              {editingBookmark?.id === bookmark.id ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEditing(bookmark)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* 主要内容：图标（左）+ 标题和链接（右，上下排列） */}
          {editingBookmark?.id === bookmark.id ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editingBookmark.title}
                onChange={(e) => setEditingBookmark({ ...editingBookmark, title: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="url"
                value={editingBookmark.url}
                onChange={(e) => setEditingBookmark({ ...editingBookmark, url: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex items-start space-x-3">
              {/* 图标在左侧 */}
              <FaviconIcon
                url={bookmark.url}
                favicon={bookmark.favicon}
                title={bookmark.title}
                size={10}
              />

              {/* 标题和链接在右侧，上下排列 */}
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-medium text-gray-900 truncate text-sm">
                  {bookmark.title}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {bookmark.url}
                </p>
              </div>
            </div>
          )}

          {/* 底部：创建时间 */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {bookmark.created_at ? new Date(bookmark.created_at).toLocaleDateString('zh-CN') : '未知时间'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  // 渲染表格视图组件
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                onClick={toggleSelectAll}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                {selectedBookmarks.size === filteredBookmarks.length ? (
                  <CheckSquare className="w-4 h-4 mr-2" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              图标
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              网站标题
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              网址
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              添加时间
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredBookmarks.map((bookmark) => (
            <tr key={bookmark.id} className="hover:bg-gray-50">
              {/* 选择框 */}
              <td className="px-4 py-4 whitespace-nowrap">
                <button
                  onClick={() => toggleBookmarkSelection(bookmark.id)}
                  className="text-gray-400 hover:text-blue-600"
                >
                  {selectedBookmarks.has(bookmark.id) ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </td>

              {/* 图标 */}
              <td className="px-4 py-4 whitespace-nowrap">
                <FaviconIcon
                  url={bookmark.url}
                  favicon={bookmark.favicon}
                  title={bookmark.title}
                  size={8}
                />
              </td>

              {/* 网站标题 */}
              <td className="px-4 py-4 whitespace-nowrap">
                {editingBookmark?.id === bookmark.id ? (
                  <input
                    type="text"
                    value={editingBookmark.title}
                    onChange={(e) => setEditingBookmark({ ...editingBookmark, title: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {bookmark.title}
                  </div>
                )}
              </td>

              {/* 网址 */}
              <td className="px-4 py-4 whitespace-nowrap">
                {editingBookmark?.id === bookmark.id ? (
                  <input
                    type="url"
                    value={editingBookmark.url}
                    onChange={(e) => setEditingBookmark({ ...editingBookmark, url: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {bookmark.url}
                  </div>
                )}
              </td>

              {/* 添加时间 */}
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {bookmark.created_at ? new Date(bookmark.created_at).toLocaleDateString('zh-CN') : '未知'}
              </td>

              {/* 操作 */}
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  {editingBookmark?.id === bookmark.id ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(bookmark)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // 如果未通过身份验证，显示登录界面
  if (!isAuthenticated) {
    return <SimpleAdminAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">管理后台</h1>
                <p className="text-xs sm:text-sm text-gray-600">QuickMark 书签管理</p>
              </div>
            </div>

            {/* 导航按钮 */}
            <nav className="flex flex-wrap items-center gap-2 sm:gap-4" aria-label="主导航">
              <a
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
              >
                <span className="hidden sm:inline">访问首页</span>
                <span className="sm:hidden">首页</span>
              </a>
              <button
                onClick={() => {
                  sessionStorage.removeItem(STORAGE_KEYS.adminAuth);
                  setIsAuthenticated(false);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-2 py-1"
                aria-label="退出登录"
              >
                退出登录
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8" role="main">
        <div className="space-y-6">
          {/* 左侧：添加书签和操作区 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 添加书签表单 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    添加书签
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        网址 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    <button
                      onClick={() => setShowTitleInput(!showTitleInput)}
                      className="w-full px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                    >
                      {showTitleInput ? '隐藏自定义标题' : '显示自定义标题'}
                    </button>

                    {showTitleInput && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          自定义标题
                        </label>
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="网站标题（可选）"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleAddBookmark}
                      disabled={isLoading || !url}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? '添加中...' : '添加书签'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 书签列表 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                  <div className="space-y-4">
                    {/* 头部：标题和搜索 */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        书签列表 ({filteredBookmarks.length})
                      </h2>

                      {/* 视图切换和搜索 */}
                      <div className="flex items-center space-x-2">
                        {/* 视图切换 */}
                        <div className="hidden lg:flex items-center space-x-1 border border-gray-200 rounded">
                          <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded ${viewMode === 'card' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            <Grid3X3 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* 搜索框 */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="搜索书签..."
                            className="w-32 sm:w-48 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                          />
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 批量操作工具栏 */}
                    {selectedBookmarks.size > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                              已选择 {selectedBookmarks.size} 个书签
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={toggleSelectAll}
                              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              {selectedBookmarks.size === filteredBookmarks.length ? '取消全选' : '全选'}
                            </button>
                            <button
                              onClick={deleteSelectedBookmarks}
                              disabled={isDeleting}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isDeleting ? '删除中...' : '删除选中'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {isLoadingBookmarks ? (
                    <div className="flex justify-center items-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredBookmarks.length === 0 ? (
                    <div className="text-center py-16">
                      {searchQuery ? (
                        <>
                          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的书签</h3>
                          <p className="text-gray-600 mb-4">尝试使用不同的关键词搜索</p>
                          <button
                            onClick={() => setSearchQuery('')}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            清除搜索条件
                          </button>
                        </>
                      ) : (
                        <>
                          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有任何书签</h3>
                          <p className="text-gray-600 mb-4">开始添加你的第一个书签吧！</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="min-h-[400px]">
                      {/* 根据视图模式渲染不同布局 */}
                      {viewMode === 'card' || window.innerWidth < 1024 ? renderCardView() : renderTableView()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 消息提示 */}
      {message && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm ${
          messageType === 'success' ? 'bg-green-600 text-white' :
          messageType === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        }`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}
    </div>
  );
}