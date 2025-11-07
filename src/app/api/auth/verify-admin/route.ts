import { NextRequest, NextResponse } from 'next/server';

// 从环境变量获取管理员密码
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // 默认密码，生产环境中应该设置复杂密码

// 检查是否为弱密码
function isWeakPassword(password: string): boolean {
  const weakPasswords = [
    'admin123', 'password', '123456', 'admin', 'root',
    'password123', '123456789', 'qwerty', 'abc123'
  ];
  return weakPasswords.includes(password.toLowerCase());
}

// 记录登录尝试（简单日志，生产环境建议使用数据库或日志服务）
function logLoginAttempt(ip: string, success: boolean, userAgent?: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: ip.replace(/\d+\.\d+$/, 'x.x'), // 部分隐藏IP保护隐私
    success,
    userAgent: userAgent?.substring(0, 100) || 'unknown'
  };

  if (!success) {
    console.warn('Failed login attempt:', logEntry);
  } else {
    console.log('Successful login:', logEntry);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // 获取客户端信息
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : (realIp || 'unknown');

    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (!password) {
      logLoginAttempt(ip, false, userAgent);
      return NextResponse.json({ error: '密码不能为空' }, { status: 400 });
    }

    // 检查是否为弱密码并警告（但在开发阶段允许通过）
    if (isWeakPassword(ADMIN_PASSWORD)) {
      console.warn('⚠️  安全警告：使用弱密码！建议在生产环境中设置强密码。');
    }

    // 验证密码
    if (password === ADMIN_PASSWORD) {
      logLoginAttempt(ip, true, userAgent);
      return NextResponse.json({
        success: true,
        message: '验证成功',
        // 在生产环境中不要返回这些信息
        ...(process.env.NODE_ENV === 'development' && {
          warning: isWeakPassword(ADMIN_PASSWORD) ? '建议在生产环境中使用强密码' : undefined
        })
      });
    } else {
      logLoginAttempt(ip, false, userAgent);
      // 添加延迟以防止暴力破解
      await new Promise(resolve => setTimeout(resolve, 1000));
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: '验证失败' }, { status: 500 });
  }
}