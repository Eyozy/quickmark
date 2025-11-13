"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, ExternalLink, Edit2, Save, X, Download, Upload, Trash2, ChevronDown, LogOut, RotateCcw } from "lucide-react";
import { getBookmarks, addBookmark, updateBookmark, deleteBookmark } from '../lib/api-client';
import FaviconIcon from '../components/FaviconIcon';
import type { Bookmark } from '../lib/api-client';

interface ImportedBookmark {
  title?: string;
  url?: string;
  description?: string;
  favicon?: string;
}

type ExportFormat = 'json' | 'csv' | 'html';

export default function Admin() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const getPreferredViewMode = (): "card" | "table" => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 ? "table" : "card";
    }
    return "card";
  };

  const [viewMode, setViewMode] = useState<"card" | "table">(getPreferredViewMode);

  
  useEffect(() => {
    const handleResize = () => {
      const preferredMode = getPreferredViewMode();
      setViewMode(preferredMode);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [showImportExport, setShowImportExport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [editingBookmark, setEditingBookmark] = useState<Bookmark & {
    tempTitle?: string;
    tempUrl?: string;
    tempDescription?: string;
    tempFavicon?: string;
  } | null>(null);

  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  
  const loadBookmarks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await getBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error('加载书签失败：', error);
      showMessage("加载书签失败", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
  const showMessage = (msg: string, type: "success" | "error" | "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  
  useEffect(() => {
    loadBookmarks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showImportExport) {
        const target = event.target as Element;
        if (!target.closest('.relative')) {
          setShowImportExport(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImportExport]);

  
  const filteredBookmarks = useMemo(() => {
    if (!searchTerm.trim()) return bookmarks;
    const searchLower = searchTerm.toLowerCase();
    return bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchLower) ||
      bookmark.url.toLowerCase().includes(searchLower) ||
      (bookmark.description?.toLowerCase().includes(searchLower))
    );
  }, [bookmarks, searchTerm]);

  const handleAddBookmark = async () => {
    if (!url) {
      showMessage('请输入网址', 'error');
      return;
    }

    setIsLoading(true);
    showMessage('正在获取网站信息...', 'info');

    try {
      let title = customTitle;
      let favicon = '';
      let description = '';

      if (!title) {
        try {
          const response = await fetch('/api/fetch-metadata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (response.ok) {
            const metadata = await response.json();
            title = metadata.data.title;
            favicon = metadata.data.favicon;
            description = metadata.data.description;
          }
        } catch {
          console.warn('获取网站信息失败，使用默认标题');
          try {
            const urlObj = new URL(url);
            title = urlObj.hostname;
          } catch {
            title = url;
          }
        }
      }

      await addBookmark({
        title: title || '未命名网站',
        url: url.trim(),
        description: description || '',
        favicon: favicon || ''
      });

      setUrl('');
      setCustomTitle('');
      setShowTitleInput(false);

      await loadBookmarks();
      showMessage('✅ 书签添加成功', 'success');
    } catch (error) {
      console.error('添加书签失败：', error);
      showMessage('❌ 添加书签失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (bookmark: Bookmark) => {
    setEditingBookmark({
      ...bookmark,
      tempTitle: bookmark.title,
      tempUrl: bookmark.url,
      tempDescription: bookmark.description || "",
      tempFavicon: bookmark.favicon || ""
    });
  };

  const saveEdit = async () => {
    if (!editingBookmark) return;

    try {
      await updateBookmark({
        id: editingBookmark.id,
        title: editingBookmark.tempTitle || editingBookmark.title,
        url: editingBookmark.tempUrl || editingBookmark.url,
        description: editingBookmark.tempDescription || editingBookmark.description,
        favicon: editingBookmark.tempFavicon || editingBookmark.favicon
      });
      setEditingBookmark(null);
      await loadBookmarks();
      showMessage("更新成功", "success");
    } catch (error) {
      console.error('更新失败：', error);
      showMessage("更新失败", "error");
    }
  };

  const cancelEdit = () => {
    setEditingBookmark(null);
  };


  /**
   * 导出书签功能
   */
  const handleExportBookmarks = (format: ExportFormat = 'json') => {
    let content: string;
    let contentType: string;
    let fileName: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(bookmarks, null, 2);
        contentType = 'application/json';
        fileName = `bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
        break;

      case 'csv': {
        if (bookmarks.length === 0) {
          showMessage('没有书签可以导出', 'error');
          return;
        }
        const headers = ['id', 'title', 'url', 'description', 'favicon', 'created_at'];
        const rows = bookmarks.map(bookmark => [
          bookmark.id,
          `"${bookmark.title.replace(/"/g, '""')}"`, // Escape quotes
          `"${bookmark.url.replace(/"/g, '""')}"`,
          bookmark.description ? `"${bookmark.description.replace(/"/g, '""')}"` : '',
          bookmark.favicon || '',
          bookmark.created_at || ''
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        contentType = 'text/csv';
        fileName = `bookmarks-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case 'html': {
        if (bookmarks.length === 0) {
          showMessage('没有书签可以导出', 'error');
          return;
        }
        const htmlContent = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${bookmarks.map(bookmark => `
    <DT><A HREF="${bookmark.url}" ADD_DATE="${Math.floor(new Date(bookmark.created_at || new Date()).getTime() / 1000)}" ICON="${bookmark.favicon || ''}">${bookmark.title}</A>
    ${bookmark.description ? `<DD>${bookmark.description}` : ''}
`).join('')}
</DL><p>
`;
        content = htmlContent;
        contentType = 'text/html';
        fileName = `bookmarks-${new Date().toISOString().slice(0, 10)}.html`;
        break;
      }

      default:
        content = JSON.stringify(bookmarks, null, 2);
        contentType = 'application/json';
        fileName = `bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
    }

    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    showMessage('书签导出成功！', 'success');
  };

  /**
   * 导入书签功能
   */
  const handleImportBookmarks = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    try {
      setImporting(true);

      if (extension === 'json' || file.type === 'application/json') {
        const content = await file.text();
        const importedBookmarks = JSON.parse(content);

        const validBookmarks = importedBookmarks.filter((bookmark: ImportedBookmark) => bookmark.url && bookmark.title);

        if (validBookmarks.length === 0) {
          showMessage('没有有效的书签可以导入', 'error');
          return;
        }

        for (const bookmark of validBookmarks) {
          await addBookmark({
            title: bookmark.title,
            url: bookmark.url,
            description: bookmark.description || '',
            favicon: bookmark.favicon || ''
          });
        }

      } else if (extension === 'html' || file.type === 'text/html') {
        const content = await file.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const anchorTags = doc.querySelectorAll('a');

        if (anchorTags.length === 0) {
          showMessage('没有找到书签', 'error');
          return;
        }

        const bookmarksToImport: ImportedBookmark[] = [];
        anchorTags.forEach((a: HTMLAnchorElement & { icon?: string }) => {
          const url = a.href;
          const title = a.textContent || '';
          if (url && title && !url.startsWith('javascript:')) {
            bookmarksToImport.push({
              title,
              url,
              description: a.nextElementSibling?.tagName === 'DD' ? a.nextElementSibling.textContent || '' : '',
              favicon: a.icon || ''
            });
          }
        });

        if (bookmarksToImport.length === 0) {
          showMessage('没有有效的书签可以导入', 'error');
          return;
        }

        for (const bookmark of bookmarksToImport) {
          if (bookmark.title && bookmark.url) {
            await addBookmark({
              title: bookmark.title,
              url: bookmark.url,
              description: bookmark.description,
              favicon: bookmark.favicon
            });
          }
        }

      } else {
        showMessage('不支持的文件格式，请使用 JSON 或 HTML 文件', 'error');
        return;
      }

      await loadBookmarks();
      showMessage('书签导入成功！', 'success');

    } catch (error) {
      console.error('导入书签失败：', error);
      showMessage('书签导入失败：' + (error instanceof Error ? error.message : '未知错误'), 'error');
    } finally {
      setImporting(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  
  const handleBulkDelete = async () => {
    if (selectedBookmarks.size === 0) {
      showMessage('请先选择要删除的书签', 'error');
      return;
    }

    const confirmMessage = `确定要删除选中的 ${selectedBookmarks.size} 个书签吗？此操作无法撤销。`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsDeleting(true);
      showMessage(`正在删除 ${selectedBookmarks.size} 个书签...`, 'info');

      const deletePromises = Array.from(selectedBookmarks).map(id => deleteBookmark(id));
      await Promise.all(deletePromises);

      setSelectedBookmarks(new Set());
      await loadBookmarks();
      showMessage(`成功删除 ${selectedBookmarks.size} 个书签`, 'success');
    } catch (error) {
      console.error('批量删除失败：', error);
      showMessage('批量删除失败，请重试', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleBookmarkSelection = (id: string) => {
    const newSelection = new Set(selectedBookmarks);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedBookmarks(newSelection);
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredBookmarks.map((bookmark) => (
        <article
          key={bookmark.id}
          className="p-6 transition-all duration-200 bg-white border shadow-sm cursor-pointer dark:bg-gray-800 rounded-2xl group hover:shadow-lg hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
          style={{
            borderColor: selectedBookmarks.has(bookmark.id) ? 'rgb(59, 130, 246)' : 'rgb(226, 232, 240)',
            boxShadow: selectedBookmarks.has(bookmark.id) ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : '0 1px 3px 0 rgb(0 0 0 / 0.1)'
          }}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (editingBookmark?.id !== bookmark.id) {
              window.open(bookmark.url, '_blank');
            }
          }}
        >
          {/* 顶部：选择框和操作按钮 */}
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmarkSelection(bookmark.id);
              }}
              className="flex items-center justify-center transition-all border-2 rounded"
              style={{
                width: '22px',
                height: '22px',
                background: selectedBookmarks.has(bookmark.id) ? 'rgb(59, 130, 246)' : 'transparent',
                borderColor: selectedBookmarks.has(bookmark.id) ? 'rgb(59, 130, 246)' : 'rgb(209, 213, 219)',
                transform: selectedBookmarks.has(bookmark.id) ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {selectedBookmarks.has(bookmark.id) && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-1 transition-opacity opacity-100">
              {editingBookmark?.id === bookmark.id ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="flex items-center justify-center px-3 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                    title="保存编辑"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center justify-center px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    title="取消编辑"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(bookmark);
                    }}
                    className="flex items-center justify-center px-3 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                    title="编辑书签"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    title="访问网站"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* 主要内容：图标 + 信息 */}
          {editingBookmark?.id === bookmark.id ? (
            <div className="space-y-4">
              <div
                className="w-full px-4 py-3 transition-all border-2 border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/30 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editingBookmark.tempTitle}
                  onChange={(e) => setEditingBookmark({ ...editingBookmark, tempTitle: e.target.value })}
                  className="w-full text-base font-medium placeholder-gray-500 bg-transparent outline-none dark:placeholder-gray-400"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="网站标题"
                />
              </div>
              <div
                className="w-full px-4 py-3 transition-all border-2 border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/30 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="url"
                  value={editingBookmark.tempUrl}
                  onChange={(e) => setEditingBookmark({ ...editingBookmark, tempUrl: e.target.value })}
                  className="w-full text-sm placeholder-gray-500 bg-transparent outline-none dark:placeholder-gray-400"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="网址"
                />
              </div>
              <div
                className="w-full px-4 py-3 transition-all border-2 border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/30 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:focus-within:ring-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editingBookmark.tempDescription}
                  onChange={(e) => setEditingBookmark({ ...editingBookmark, tempDescription: e.target.value })}
                  className="w-full text-sm placeholder-gray-500 bg-transparent outline-none dark:placeholder-gray-400"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="描述"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div
                  className="flex items-center justify-center flex-shrink-0 w-8 h-8 overflow-hidden rounded-xl"
                  style={{
                    background: 'var(--background-tertiary)',
                    border: '1px solid var(--separator-non-opaque)'
                  }}
                >
                  <FaviconIcon
                    url={bookmark.url}
                    favicon={bookmark.favicon}
                    title={bookmark.title}
                    size={16}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-base font-semibold truncate"
                    style={{
                      color: 'var(--text-primary)',
                      height: '20px',
                      lineHeight: '20px',
                      marginBottom: '4px'
                    }}
                    title={bookmark.description ? bookmark.description : bookmark.title}
                  >
                    {bookmark.title}
                  </h3>
                  {bookmark.description && (
                    <p
                      className="text-sm truncate"
                      style={{
                        color: 'var(--text-tertiary)',
                        height: '20px',
                        lineHeight: '20px'
                      }}
                      title={bookmark.description}
                    >
                      {bookmark.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 网址 */}
              <div
                className="px-3 py-2 font-mono text-xs truncate rounded-lg"
                style={{
                  background: 'var(--background-tertiary)',
                  color: 'var(--text-tertiary)',
                  border: '1px solid var(--separator-non-opaque)'
                }}
              >
                {bookmark.url}
              </div>
            </div>
          )}

          {/* 底部：创建时间 */}
          <div
            className="flex items-center justify-between pt-4 mt-5 border-t"
            style={{
              borderColor: 'var(--separator-non-opaque)'
            }}
          >
            <div
              className="text-xs font-medium"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {bookmark.created_at ?
                new Date(bookmark.created_at).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }) :
                '未知时间'
              }
            </div>
            {bookmark.created_at && (
              <div
                className="text-xs"
                style={{ color: 'var(--text-quaternary)' }}
              >
                {new Date(bookmark.created_at).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* 导航栏 */}
      <header className="w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
        <div className="px-3 py-3 mx-auto max-w-7xl sm:px-4 lg:px-8 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <img src="/favicon.svg" alt="QuickMark" className="w-8 h-8 sm:w-10 sm:h-10" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 sm:text-2xl dark:text-gray-100">
                  QuickMark 管理
                </h1>
                <p className="hidden text-xs text-gray-500 sm:text-sm dark:text-gray-400 sm:block">
                  书签管理中心
                </p>
              </div>
            </div>

            {/* 导航操作 */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <a
                href="/"
                className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center space-x-1 sm:space-x-2 transition-colors"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">返回首页</span>
                <span className="sm:hidden">首页</span>
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem('authenticated');
                  localStorage.removeItem('authTime');
                  window.location.href = '/login';
                }}
                className="px-2 py-1.5 sm:px-4 sm:py-2 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center space-x-1 sm:space-x-2 transition-colors"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">退出登录</span>
                <span className="sm:hidden">退出</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* 快速添加区域 - 苹果风格 */}
          <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
            <div className="flex flex-col gap-2 px-4 py-3 border-b border-gray-200 sm:px-6 sm:py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-500 to-blue-600">
              <h2 className="flex items-center text-base font-semibold text-white sm:text-lg">
                <Plus className="w-4 h-4 mr-2 sm:w-5 sm:h-5 sm:mr-3" />
                快速添加书签
              </h2>
              <button
                onClick={() => setShowTitleInput(!showTitleInput)}
                className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white hover:bg-white/20 transition-all"
              >
                {showTitleInput ? '收起选项' : '展开选项'}
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col space-y-3 sm:space-y-4">
                {/* 主要输入区域 - URL 输入框，无图标，按钮在同一行 */}
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="输入网址，按 Enter 快速添加..."
                    className="flex-1 px-3 py-3 text-sm transition-all bg-white border sm:px-4 sm:py-4 sm:text-base border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAddBookmark()}
                  />
                  <button
                    onClick={handleAddBookmark}
                    disabled={isLoading || !url}
                    className="px-4 py-3 sm:px-8 sm:py-4 rounded-lg text-sm sm:text-base font-semibold bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[48px] sm:min-h-[60px] sm:min-w-[100px]"
                  >
                    {isLoading ? '添加中...' : '添加'}
                  </button>
                </div>

                {/* 高级选项区域 - 渐进式披露，带过渡效果 */}
                <div className={`mt-2 sm:mt-4 overflow-hidden transition-all duration-300 ease-in-out ${
                  showTitleInput ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="p-3 border border-transparent sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <label className="block mb-1 text-xs font-medium sm:text-sm sm:mb-2 text-slate-700 dark:text-slate-300">
                      自定义标题
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="网站标题（可选）"
                      className="w-full px-3 py-2 text-xs transition-all bg-white border rounded-lg sm:px-4 sm:py-3 sm:text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 搜索和工具栏 */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
            {/* 批量操作栏 */}
            {selectedBookmarks.size > 0 && (
              <div className="flex flex-col gap-2 p-2 mb-4 border border-blue-200 rounded-lg sm:p-3 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                    已选择 {selectedBookmarks.size} 个书签
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedBookmarks(new Set())}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm transition-colors"
                  >
                    取消选择
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className="px-2 py-1 sm:px-3 sm:py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs sm:text-sm flex items-center space-x-1 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{isDeleting ? '删除中...' : '批量删除'}</span>
                    <span className="sm:hidden">{isDeleting ? '删除' : '删除'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search
                  className="absolute z-10 w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 sm:left-4 top-1/2 sm:w-5 sm:h-5"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="搜索书签..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg sm:pl-12 sm:pr-12 sm:py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">

                {/* 导入按钮 */}
                <label className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1 sm:space-x-2 cursor-pointer transition-colors">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">导入</span>
                  <input
                    type="file"
                    accept=".json,text/html"
                    onChange={handleImportBookmarks}
                    className="hidden"
                    disabled={importing}
                  />
                </label>

                {/* 导出按钮 */}
                <div className="relative">
                  <button
                    onClick={() => setShowImportExport(!showImportExport)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1 sm:space-x-2 transition-colors"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">导出</span>
                    <ChevronDown className="w-2 h-2 sm:w-3 sm:h-3" />
                  </button>

                  {showImportExport && (
                    <div className="absolute right-0 z-10 w-24 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg sm:w-32 dark:bg-gray-800 dark:border-gray-600">
                      {(['json', 'csv', 'html'] as ExportFormat[]).map((format) => (
                        <button
                          key={format}
                          onClick={() => {
                            handleExportBookmarks(format);
                            setShowImportExport(false);
                          }}
                          className="block w-full px-3 py-2 text-xs text-left sm:px-4 sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 刷新按钮 */}
                <button
                  onClick={() => loadBookmarks(true)}
                  disabled={refreshing}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs sm:text-sm font-medium flex items-center space-x-1 sm:space-x-2 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">刷新</span>
                </button>
              </div>
            </div>
          </div>

          {/* 书签列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div
                  className="w-12 h-12 mx-auto mb-6 rounded-full animate-spin"
                  style={{
                    border: '3px solid var(--background-tertiary)',
                    borderTop: '3px solid var(--system-blue)'
                  }}
                />
                <p style={{ color: 'var(--text-tertiary)' }}>加载书签中...</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === "card" ? renderCardView() : (
                <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                  <table className="w-full">
                    <thead style={{ background: 'var(--background-secondary)' }}>
                      <tr>
                        <th className="w-12 px-4 py-4 text-xs font-medium text-left" style={{ color: 'var(--text-primary)' }}>
                          <button
                            onClick={() => {
                              if (selectedBookmarks.size === filteredBookmarks.length) {
                                setSelectedBookmarks(new Set());
                              } else {
                                setSelectedBookmarks(new Set(filteredBookmarks.map(b => b.id)));
                              }
                            }}
                            className="flex items-center justify-center transition-all border-2 rounded"
                            style={{
                              width: '20px',
                              height: '20px',
                              background: selectedBookmarks.size === filteredBookmarks.length ? 'rgb(59, 130, 246)' : 'transparent',
                              borderColor: selectedBookmarks.size === filteredBookmarks.length ? 'rgb(59, 130, 246)' : 'rgb(209, 213, 219)',
                              transform: selectedBookmarks.size === filteredBookmarks.length ? 'scale(1.1)' : 'scale(1)'
                            }}
                          >
                            {selectedBookmarks.size === filteredBookmarks.length && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-4 text-xs font-medium text-left" style={{ color: 'var(--text-primary)', width: '45%' }}>网站信息</th>
                        <th className="px-4 py-4 text-xs font-medium text-left" style={{ color: 'var(--text-primary)', width: '25%' }}>网址</th>
                        <th className="px-4 py-4 text-xs font-medium text-left" style={{ color: 'var(--text-primary)', width: '15%' }}>添加时间</th>
                        <th className="px-4 py-4 text-xs font-medium text-right" style={{ color: 'var(--text-primary)', width: '15%' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookmarks.map((bookmark) => (
                        <tr
                          key={bookmark.id}
                          className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${
                            selectedBookmarks.has(bookmark.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <td className="px-4 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmarkSelection(bookmark.id);
                              }}
                              className="flex items-center justify-center transition-all border-2 rounded"
                              style={{
                                width: '20px',
                                height: '20px',
                                background: selectedBookmarks.has(bookmark.id) ? 'rgb(59, 130, 246)' : 'transparent',
                                borderColor: selectedBookmarks.has(bookmark.id) ? 'rgb(59, 130, 246)' : 'rgb(209, 213, 219)',
                                transform: selectedBookmarks.has(bookmark.id) ? 'scale(1.1)' : 'scale(1)'
                              }}
                            >
                              {selectedBookmarks.has(bookmark.id) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4" style={{ maxWidth: '0', overflow: 'hidden' }}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="flex items-center justify-center flex-shrink-0 w-8 h-8 overflow-hidden rounded-xl"
                                style={{
                                  background: 'var(--background-tertiary)',
                                  border: '1px solid var(--separator-non-opaque)'
                                }}
                              >
                                <FaviconIcon
                                  url={bookmark.url}
                                  favicon={bookmark.favicon}
                                  title={bookmark.title}
                                  size={16}
                                />
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div
                                  className="text-sm font-medium truncate"
                                  style={{
                                    color: 'var(--text-primary)',
                                    height: '20px',
                                    lineHeight: '20px',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={bookmark.description ? `${bookmark.title} - ${bookmark.description}` : bookmark.title}
                                >
                                  {bookmark.title}
                                </div>
                                {bookmark.description && (
                                  <div
                                    className="text-xs truncate"
                                    style={{
                                      color: 'var(--text-tertiary)',
                                      height: '18px',
                                      lineHeight: '18px',
                                      whiteSpace: 'nowrap'
                                    }}
                                    title={bookmark.description}
                                  >
                                    {bookmark.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4" style={{ maxWidth: '0', overflow: 'hidden' }}>
                            <div className="font-mono text-xs truncate" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }} title={bookmark.url}>
                              {bookmark.url}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {bookmark.created_at ? new Date(bookmark.created_at).toLocaleDateString('zh-CN') : '未知'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {editingBookmark?.id === bookmark.id ? (
                                <>
                                  <button
                                    onClick={saveEdit}
                                    className="inline-flex items-center justify-center w-8 h-8 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
                                    title="保存"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="inline-flex items-center justify-center w-8 h-8 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                                    title="取消"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(bookmark)}
                                    className="inline-flex items-center justify-center w-8 h-8 text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
                                    title="编辑"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={bookmark.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-8 h-8 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
                                    title="访问网站"
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
              )}

              {/* 空状态 */}
              {filteredBookmarks.length === 0 && (
                <div className="p-12 text-center bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                  <div className="mb-4 text-6xl">📚</div>
                  <h3 className="mb-2 text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                    {searchTerm ? '没有找到匹配的书签' : '还没有任何书签'}
                  </h3>
                  <p style={{ color: 'var(--text-tertiary)' }} className="mb-4">
                    {searchTerm ? '尝试使用不同的关键词搜索' : '开始添加你的第一个书签吧！'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="px-4 py-2 rounded-lg apple-button btn-secondary"
                    >
                      清除搜索
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* 消息提示 - 修复可访问性背景颜色 */}
      {message && (
        <div
          className="fixed z-50 max-w-sm px-6 py-4 border shadow-lg bottom-8 right-8 rounded-xl backdrop-blur-sm"
          style={{
            background: messageType === 'success'
              ? 'linear-gradient(135deg, hsl(142.1, 76.2%, 36.3%), hsl(142.1, 71.6%, 31.2%))'
              : messageType === 'error'
                ? 'linear-gradient(135deg, hsl(0, 84.2%, 60.2%), hsl(0, 79.2%, 55.1%))'
                : 'linear-gradient(135deg, hsl(198.6, 88.7%, 48.4%), hsl(198.6, 83.7%, 43.3%))',
            color: 'white',
            borderColor: messageType === 'success'
              ? 'hsl(142.1, 76.2%, 26.3%)'
              : messageType === 'error'
                ? 'hsl(0, 84.2%, 50.2%)'
                : 'hsl(198.6, 88.7%, 38.4%)',
            boxShadow: `0 10px 25px -5px ${messageType === 'success'
              ? 'rgba(34, 197, 94, 0.3)'
              : messageType === 'error'
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(59, 130, 246, 0.3)'}, 0 4px 6px -2px rgba(0, 0, 0, 0.1)`
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {messageType === 'success' && (
                <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full bg-opacity-20 ring-2 ring-white ring-opacity-30">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {messageType === 'error' && (
                <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full bg-opacity-20 ring-2 ring-white ring-opacity-30">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {messageType === 'info' && (
                <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full bg-opacity-20 ring-2 ring-white ring-opacity-30">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-sm font-medium leading-relaxed drop-shadow-sm">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}