import { NextRequest, NextResponse } from 'next/server';

// 简单的 IP 限流存储（生产环境建议使用 Redis）
const ipAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();

// 清理过期的 IP 记录
function cleanupExpiredIPs() {
  const now = Date.now();
  for (const [ip, data] of ipAttempts.entries()) {
    if (data.blockedUntil && now > data.blockedUntil) {
      ipAttempts.delete(ip);
    } else if (!data.blockedUntil && now - data.lastAttempt > 3 * 60 * 60 * 1000) { // 3 小时后重置
      ipAttempts.delete(ip);
    }
  }
}

// 获取客户端 IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIP || 'unknown';
  return ip;
}

// 简化的管理员密码验证 + IP 限流
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    // 清理过期记录
    cleanupExpiredIPs();

    // 检查 IP 是否被禁用
    const ipData = ipAttempts.get(clientIP);
    if (ipData?.blockedUntil && Date.now() < ipData.blockedUntil) {
      const remainingTime = Math.ceil((ipData.blockedUntil - Date.now()) / (1000 * 60));
      return NextResponse.json({
        error: `IP已被禁用，请在${remainingTime}分钟后重试`
      }, { status: 429 });
    }

    const { password } = await request.json();

    // 检查密码是否提供
    if (!password) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 });
    }

    // 从环境变量获取管理员密码
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('管理员密码未配置');
      return NextResponse.json({ error: '服务器配置错误' }, { status: 500 });
    }

    // 验证密码
    if (password === adminPassword) {
      // 密码正确，清除该IP的失败记录
      if (ipData) {
        ipAttempts.delete(clientIP);
      }

      return NextResponse.json({
        success: true,
        message: '验证成功',
        timestamp: new Date().toISOString()
      });
    } else {
      // 密码错误，记录失败尝试
      const currentData = ipData || { count: 0, lastAttempt: 0 };
      const newCount = currentData.count + 1;
      const now = Date.now();

      ipAttempts.set(clientIP, {
        count: newCount,
        lastAttempt: now,
        blockedUntil: newCount >= 3 ? now + (3 * 60 * 60 * 1000) : undefined // 3 小时禁用
      });

      const remainingAttempts = Math.max(0, 3 - newCount);

      return NextResponse.json({
        error: `密码错误，剩余尝试次数：${remainingAttempts}`
      }, { status: 401 });
    }

  } catch (error) {
    console.error('密码验证错误：', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}