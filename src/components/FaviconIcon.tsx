import { getFaviconUrl, getFaviconFallback } from '../lib/favicon-utils';

interface FaviconIconProps {
  url: string;
  favicon?: string;
  title?: string;
  size?: number;
  className?: string;
}

export default function FaviconIcon({
  url,
  favicon,
  title,
  size = 16,
  className = ""
}: FaviconIconProps) {
  const faviconUrl = favicon || getFaviconUrl(url);
  const fallbackLetter = getFaviconFallback(url);

  if (faviconUrl) {
    return (
      <img
        src={faviconUrl}
        alt={`${title || '网站'} favicon`}
        className={className}
        style={{ width: size, height: size }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `<span class="text-gray-400 font-medium" style="font-size: ${size}px">${fallbackLetter}</span>`;
          }
        }}
      />
    );
  }

  return (
    <span
      className={`text-gray-400 font-medium flex items-center justify-center ${className}`}
      style={{ fontSize: size }}
    >
      {fallbackLetter}
    </span>
  );
}