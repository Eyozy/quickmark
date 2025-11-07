/**
 * Favicon 工具函数
 * 使用 favicon.im 服务获取网站图标
 */

export function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // 使用 favicon.im 服务获取图标
    // 格式：https://favicon.im/google.com
    return `https://favicon.im/${domain}`;
  } catch (error) {
    console.error('Favicon URL generation error:', error);
    return '';
  }
}

export function getFaviconFallback(url: string): string {
  // 对于没有 favicon 的网站，返回首字母
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.charAt(0).toUpperCase();
  } catch {
    return 'W'; // 默认字母 "Web"
  }
}

/**
 * 验证域名是否有效（非 localhost/IP）
 */
export function isValidDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // 排除 localhost 和 IP 地址
    const invalidDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
    const isLocalhost = invalidDomains.includes(domain);
    const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(domain);

    return !isLocalhost && !isIP;
  } catch {
    return false;
  }
}

/**
 * 获取完整的 favicon 信息
 */
export function getFaviconInfo(url: string, existingFavicon?: string) {
  // 如果已有 favicon 且不是空的，直接返回
  if (existingFavicon && existingFavicon.trim() !== '') {
    return {
      url: existingFavicon,
      useService: false,
      hasValidFavicon: true
    };
  }

  // 如果域名有效，使用 favicon.im 服务
  if (isValidDomain(url)) {
    return {
      url: getFaviconUrl(url),
      useService: true,
      hasValidFavicon: true
    };
  }

  // 对于本地域名，不使用外部服务
  return {
    url: '',
    useService: false,
    hasValidFavicon: false
  };
}