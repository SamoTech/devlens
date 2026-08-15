import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit.mjs';
import { normalizeOrgEntry } from '@/lib/watchlist-validation.mjs';

const redis = Redis.fromEnv();
const KEY = 'devlens:org-watchlist';
const LOCK_KEY = 'devlens:org-watchlist:lock';
const MAX = 100;
export interface OrgEntry {
  org: string;
  repoCount: number;
  avgScore: number;
  topRepo: string | null;
  savedAt: string;
}

async function acquireLock(): Promise<boolean> {
  const result = await redis.set(LOCK_KEY, `${Date.now()}-${Math.random()}`, { nx: true, ex: 5 });
  return result === 'OK';
}

async function releaseLock() {
  try { await redis.del(LOCK_KEY); } catch {}
}

export async function GET(req: Request) {
  try {
    const limit = await consumeRateLimit(redis, requestIdentity(req), 'watchlist');
    if (!limit.allowed) return NextResponse.json({ error: 'rate_limited', message: 'Watchlist rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers });
    const list = await redis.lrange<OrgEntry>(KEY, 0, MAX - 1);
    return NextResponse.json({ list: list ?? [] }, { headers: limit.headers });
  } catch (err) {
    console.error('org-watchlist GET error', err);
    return NextResponse.json({ list: [], degraded: true });
  }
}

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 16_384) return NextResponse.json({ ok: false, error: 'payload_too_large' }, { status: 413 });
  const limit = await consumeRateLimit(redis, requestIdentity(req), 'watchlist');
  if (!limit.allowed) return NextResponse.json({ ok: false, error: 'rate_limited', message: 'Watchlist rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers });
  const entry = normalizeOrgEntry(await req.json().catch(() => null));
  if (!entry) return NextResponse.json({ ok: false, error: 'invalid_organization' }, { status: 400 });

  let locked = false;
  try {
    locked = await acquireLock();
    if (!locked) return NextResponse.json({ ok: false, error: 'watchlist_busy' }, { status: 409 });
    const existing = await redis.lrange<OrgEntry>(KEY, 0, MAX - 1);
    for (const item of existing ?? []) {
      if (item?.org === entry.org) await redis.lrem(KEY, 0, item);
    }
    await redis.lpush(KEY, entry);
    await redis.ltrim(KEY, 0, MAX - 1);
    return NextResponse.json({ ok: true }, { headers: limit.headers });
  } catch (err) {
    console.error('org-watchlist POST error', err);
    return NextResponse.json({ ok: false, error: 'watchlist_unavailable' }, { status: 503 });
  } finally {
    if (locked) await releaseLock();
  }
}
