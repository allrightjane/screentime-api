import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 简单密钥保护（后面可改）
  const key = req.query.key;
  if (key !== 'mysecret123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const logs = await redis.lrange('logs', 0, 99); // 最近 100 条
    const parsed = logs.map(item => {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: '服务器错误' });
  }
}
