"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('authTime', Date.now().toString());
        navigate('/admin');
      } else {
        setError(data.error || '密码错误，请重试');
        setPassword('');
      }
    } catch (err) {
      console.error('登录失败：', err);
      setError('登录失败，请检查 API 服务器是否启动（npm run dev:full）');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="w-full max-w-md px-6">
        {/* Logo 和标题 - 苹果风格 */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <img src="/favicon.svg" alt="QuickMark" className="w-20 h-20" />
          </div>
          <h1 className="mb-3 text-4xl font-semibold text-gray-900 dark:text-gray-100">
            QuickMark
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            管理后台登录
          </p>
        </div>

        {/* 登录卡片 - 苹果风格 */}
        <div className="p-8 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className="block mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                管理员密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 text-base text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入管理员密码"
                  required
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 错误提示 - 苹果风格 */}
            {error && (
              <div className="p-4 text-sm leading-relaxed text-red-700 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                {error}
              </div>
            )}

            {/* 登录按钮 - 苹果风格 */}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full px-6 py-4 text-base font-semibold text-white transition-all bg-blue-500 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 返回首页 */}
          <div className="pt-6 mt-6 text-center border-t border-gray-200 dark:border-gray-700">
            <a
              href="/"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            >
              ← 返回首页
            </a>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 text-xs text-center text-gray-500 dark:text-gray-400">
          <p>使用环境变量 ADMIN_PASSWORD 中配置的密码登录</p>
          <p className="mt-2 text-gray-400 dark:text-gray-500">登录状态有效期 1 小时</p>
        </div>
      </div>
    </div>
  );
}
