"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, RotateCcw, ExternalLink } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { getFaviconUrl, getFaviconFallback } from '@/lib/favicon-utils';
import { DEFAULT_USER_ID } from '@/lib/constants';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  created_at?: string;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 从 Supabase 加载书签数据
  const loadBookmarks = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', DEFAULT_USER_ID) // 只获取默认用户的书签
        .order('created_at', { ascending: false });

      if (error) {
        console.error('加载书签失败：', error);
        // 如果加载失败，显示一些示例数据
        setBookmarks([
          {
            id: "demo-1",
            title: "GitHub",
            url: "https://github.com",
            description: "Where the world builds software",
            favicon: "https://github.com/favicon.ico"
          }
        ]);
      } else {
        setBookmarks(data || []);
      }
    } catch (error) {
      console.error('加载书签出错：', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBookmarks();
  }, []);

  // 使用 useMemo 优化搜索性能
  const filteredBookmarks = useMemo(() => {
    if (!searchTerm.trim()) return bookmarks;

    const searchLower = searchTerm.toLowerCase();
    return bookmarks.filter(bookmark =>
      bookmark.title.toLowerCase().includes(searchLower) ||
      bookmark.url.toLowerCase().includes(searchLower)
    );
  }, [bookmarks, searchTerm]);

  // 统计搜索结果
  const resultCount = filteredBookmarks.length;
  const hasSearchResults = searchTerm.trim() && resultCount > 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* 标题和搜索框 */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-4 sm:mb-6 lg:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light text-gray-900 mr-4">QuickMark</h1>
          </div>
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-6 sm:mb-8 lg:mb-10">
            个人极简书签中心
          </p>

          {/* 搜索框 */}
          <div className="w-full max-w-lg sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 sm:left-5 lg:left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              <input
                type="text"
                placeholder="搜索书签... (标题、网址)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-12 lg:pl-14 pr-10 sm:pr-12 lg:pr-14 py-3 sm:py-4 lg:py-5 text-sm sm:text-base lg:text-lg xl:text-xl border border-gray-200 rounded-2xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 sm:right-5 lg:right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm sm:text-base"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 搜索结果统计 */}
            {searchTerm && (
              <div className="mt-2 text-xs sm:text-sm lg:text-base text-gray-600">
                {hasSearchResults ? (
                  <span>找到 {resultCount} 个相关书签</span>
                ) : (
                  <span className="text-red-600">没有找到匹配的书签</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="flex justify-center items-center py-12 sm:py-16 lg:py-20">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* 书签网格 */}
            <div className="w-full max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filteredBookmarks.map((bookmark) => (
                  <a
                    key={bookmark.id}
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 sm:p-4 lg:p-5 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      {/* Favicon */}
                      <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {(() => {
                          const faviconUrl = bookmark.favicon || getFaviconUrl(bookmark.url);
                          const fallbackLetter = getFaviconFallback(bookmark.url);

                          return faviconUrl ? (
                            <img
                              src={faviconUrl}
                              alt={`${bookmark.title} favicon`}
                              className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-gray-400 text-xs sm:text-sm font-medium">${fallbackLetter}</span>`;
                                }
                              }}
                              onLoad={(e) => {
                                // 图片加载成功时确保显示
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'block';
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 text-xs sm:text-sm font-medium">
                              {fallbackLetter}
                            </span>
                          );
                        })()}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {bookmark.title}
                          </h3>
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 truncate mt-1">
                          {bookmark.url}
                        </p>
                      </div>
                    </div>
                  </a>
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

      {/* 页脚 - 始终在底部 */}
      {!loading && bookmarks.length > 0 && (
        <footer className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 border-t border-gray-200 bg-gray-50">
          <div className="w-full max-w-6xl mx-auto flex justify-between items-center text-xs sm:text-sm lg:text-base text-gray-600">
            <div>
              显示 {resultCount} / {bookmarks.length} 个书签
            </div>
            <a
              href="/admin"
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>管理书签</span>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
