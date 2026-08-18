import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  // 只允许 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appName = req.query.app;
  if (!appName) {
    return res.status(400).json({ error: '缺少 App 名称' });
  }

  try {
    const now = new Date().toISOString();
    const timestamp = Date.now();

    // 获取该 App 上一次状态
    const lastStatus = await redis.get(`status:${appName}`) || 'close';
    const newStatus = lastStatus === 'open' ? 'close' : 'open';

    // 更新状态
    await redis.set(`status:${appName}`, newStatus);

    // 写入日志
    const log = {
      app: appName,
      status: newStatus,
      time: now,
      timestamp
    };

    // 用 list 存最近日志（最多保留 200 条）
    await redis.lpush('logs', JSON.stringify(log));
    await redis.ltrim('logs', 0, 199);

    return res.status(200).json({
      ok: true,
      app: appName,
      status: newStatus,
      time: now
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: '服务器错误', detail: error.message });
  }
}
