import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory cache for IP daily usage (resets at midnight UTC)
// Supported in serverless and edge environments to track IP counts across tabs and incognito sessions
const ipUsageMap = new Map<string, { date: string; count: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const fileCount = typeof body.fileCount === 'number' ? body.fileCount : 1;
    const isIncrement = Boolean(body.increment);

    const clientIp = getClientIp(req);
    const today = new Date().toISOString().split('T')[0];

    const currentRecord = ipUsageMap.get(clientIp);
    const currentCount = currentRecord && currentRecord.date === today ? currentRecord.count : 0;

    const limit = 5;

    if (!isIncrement) {
      // Pre-check if client IP has quota left
      if (currentCount + fileCount > limit) {
        return NextResponse.json({
          allowed: false,
          remaining: Math.max(0, limit - currentCount),
          currentCount,
          limit,
          error: 'IP daily upload limit reached (maximum 5 files per day). Please sign in or upgrade to SpikeDocs Pro.',
        });
      }

      return NextResponse.json({
        allowed: true,
        remaining: Math.max(0, limit - currentCount),
        currentCount,
        limit,
      });
    }

    // Increment count after processing
    const newCount = currentCount + fileCount;
    ipUsageMap.set(clientIp, { date: today, count: newCount });

    return NextResponse.json({
      allowed: true,
      remaining: Math.max(0, limit - newCount),
      currentCount: newCount,
      limit,
    });
  } catch (error) {
    console.error('IP rate limiter error:', error);
    // On unexpected error, do not completely block client but log issue
    return NextResponse.json({ allowed: true, remaining: 5, currentCount: 0, limit: 5 });
  }
}
