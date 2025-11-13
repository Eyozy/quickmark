"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, ExternalLink, X } from "lucide-react";
import { getBookmarks } from '../lib/api-client';
import { getFaviconUrl, getFaviconFallback } from '../lib/favicon-utils';
import type { Bookmark } from '../lib/api-client';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    try {
      setLoading(true);

      const data = await getBookmarks();
      setBookmarks(data);

    } catch (error) {
      console.error('加载书签失败：', error);
        setBookmarks([
        {
          id: "demo-1",
          title: "GitHub",
          url: "https://github.com",
          description: "Where the world builds software",
          favicon: "https://github.com/favicon.ico"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const filteredBookmarks = useMemo(() => {
    if (!searchTerm.trim()) return bookmarks;

    const searchLower = searchTerm.toLowerCase();
    return bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchLower) ||
      bookmark.url.toLowerCase().includes(searchLower)
    );
  }, [bookmarks, searchTerm]);

  const resultCount = filteredBookmarks.length;
  const hasSearchResults = searchTerm.trim() && resultCount > 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* 苹果风格导航栏 */}
      <header className="w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/favicon.svg" alt="QuickMark" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  QuickMark
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  个人极简书签中心
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* 苹果风格搜索区域 */}
        <div className="text-center mb-12">
          {/* 响应式搜索框 */}
          <div className="w-full max-w-3xl mx-auto mb-6">
            <div className="relative group">
              <Search
                className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="搜索书签标题或网址..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-14 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm focus:shadow-md transition-all"
                aria-label="搜索书签"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors z-10"
                  aria-label="清除搜索"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 搜索结果统计 */}
            {searchTerm && (
              <div className="mt-4">
                {hasSearchResults ? (
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--system-blue)' }}
                  >
                    找到 {resultCount} 个相关书签
                  </p>
                ) : (
                  <p
                    className="text-sm"
                    style={{ color: 'var(--system-red)' }}
                  >
                    没有找到匹配的书签
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 苹果风格加载状态 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-12 w-12 mx-auto mb-6"
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
            {/* 响应式书签网格 */}
            <div className="w-full max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookmarks.map((bookmark) => (
                  <article
                    key={bookmark.id}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 group hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                  >
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                      aria-label={`访问 ${bookmark.title} 网站`}
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        {/* 响应式图标 */}
                        <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                          {(() => {
                            const faviconUrl = bookmark.favicon || getFaviconUrl(bookmark.url);
                            const fallbackLetter = getFaviconFallback(bookmark.url);

                            return faviconUrl ? (
                              <img
                                src={faviconUrl}
                                alt={`${bookmark.title} favicon`}
                                className="w-6 h-6"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<span class="text-gray-400 text-base font-medium">${fallbackLetter}</span>`;
                                  }
                                }}
                                style={{ display: 'block' }}
                              />
                            ) : (
                              <span className="text-gray-400 text-base font-medium">
                                {fallbackLetter}
                              </span>
                            );
                          })()}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3
                              className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 transition-colors"
                              title={bookmark.title}
                            >
                              {bookmark.title}
                            </h3>
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                          </div>
                          <p
                            className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1"
                            title={bookmark.url}
                          >
                            {bookmark.url}
                          </p>
                        </div>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            </div>

            {/* 空状态 */}
            {filteredBookmarks.length === 0 && (
              <div className="w-full max-w-7xl mx-auto text-center py-12 sm:py-16 lg:py-20">
                {searchTerm ? (
                  <>
                    <div className="text-gray-400 text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">🔍</div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-gray-900 mb-2 sm:mb-4">没有找到匹配的书签</h3>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">尝试使用不同的关键词搜索</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base lg:text-lg"
                    >
                      清除搜索条件
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">📚</div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-gray-900 mb-2 sm:mb-4">还没有任何书签</h3>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8">开始添加你的第一个书签吧！</p>
                    <a
                      href="/admin"
                      className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base lg:text-lg"
                    >
                      <span>添加书签</span>
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    </a>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 页脚 */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="w-full max-w-6xl mx-auto flex justify-center items-center">
          <div className="text-center">
            <p className="text-xs sm:text-sm lg:text-base text-gray-500">
              © {new Date().getFullYear()} QuickMark. Reserved by{' '}
              <a
                href="https://github.com/Eyozy/quickmark/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-all duration-300 relative inline-block group"
              >
                <span className="relative z-10">Eyozy</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gray-800 transition-all duration-300 group-hover:w-full"></span>
              </a>
              {' '}· Inspired by{' '}
              <a
                href="https://github.com/darekkay/static-marks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-800 transition-all duration-300 relative inline-block group"
              >
                <span className="relative z-10">Static Marks</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gray-800 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}