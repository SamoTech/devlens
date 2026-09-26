import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import { parseRepoSlug } from '@/lib/repo-validation.mjs';
import { consumeRateLimit, requestIdentity } from '@/lib/rate-limit.mjs';
import { normalizeWatchEntry } from '@/lib/watchlist-validation.mjs';

const redis = Redis.fromEnv();
const KEY = 'devlens:watchlist';
const LOCK_KEY = 'devlens:watchlist:lock';
const MAX = 100;

export interface WatchEntry {
  slug: string;
  score: number;
  description: string | null;
  language: string | null;
  savedAt: string;
}

async function acquireLock(): Promise<boolean> {
  return (await redis.set(LOCK_KEY, `${Date.now()}-${Math.random()}`, { nx: true, ex: 5 })) === 'OK';
}
async function releaseLock() { try { await redis.del(LOCK_KEY); } catch {} }

function dedupe(entries: WatchEntry[]): WatchEntry[] {
  const seen = new Set<string>();
  const result: WatchEntry[] = [];
  for (const item of entries) {
    const normalized = normalizeWatchEntry(item);
    if (!normalized || seen.has(normalized.slug)) continue;
    seen.add(normalized.slug);
    result.push({ ...normalized, savedAt: item.savedAt || normalized.savedAt });
    if (result.length >= MAX) break;
  }
  return result;
}

async function readCanonicalList(): Promise<WatchEntry[]> {
  const raw = await redis.lrange<WatchEntry>(KEY, 0, MAX - 1);
  const canonical = dedupe(raw ?? []);
  if ((raw ?? []).length !== canonical.length) {
    let locked = false;
    try {
      locked = await acquireLock();
      if (locked) {
        await redis.del(KEY);
        if (canonical.length) await redis.rpush(KEY, ...canonical);
      }
    } finally { if (locked) await releaseLock(); }
  }
  return canonical;
}

export async function GET(req: Request) {
  try {
    const limit = await consumeRateLimit(redis, requestIdentity(req), 'watchlist');
    if (!limit.allowed) return NextResponse.json({ error: 'rate_limited', message: 'Watchlist rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers });
    return NextResponse.json({ list: await readCanonicalList() }, { headers: limit.headers });
  } catch (err) {
    console.error('watchlist GET error', err);
    return NextResponse.json({ list: [], degraded: true });
  }
}

export async function POST(req: Request) {
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 16_384) return NextResponse.json({ ok: false, error: 'payload_too_large' }, { status: 413 });
  const limit = await consumeRateLimit(redis, requestIdentity(req), 'watchlist');
  if (!limit.allowed) return NextResponse.json({ ok: false, error: 'rate_limited', message: 'Watchlist rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers });
  const entry = normalizeWatchEntry(await req.json().catch(() => null));
  if (!entry) return NextResponse.json({ ok: false, error: 'invalid_repository' }, { status: 400 });

  let locked = false;
  try {
    locked = await acquireLock();
    if (!locked) return NextResponse.json({ ok: false, error: 'watchlist_busy' }, { status: 409 });
    const existing = dedupe((await redis.lrange<WatchEntry>(KEY, 0, MAX - 1)) ?? []);
    const next = [entry, ...existing.filter(item => item.slug !== entry.slug)].slice(0, MAX);
    await redis.del(KEY);
    await redis.rpush(KEY, ...next);
    return NextResponse.json({ ok: true }, { headers: limit.headers });
  } catch (err) {
    console.error('watchlist POST error', err);
    return NextResponse.json({ ok: false, error: 'watchlist_unavailable' }, { status: 503 });
  } finally { if (locked) await releaseLock(); }
}

export async function DELETE(req: Request) {
  const limit = await consumeRateLimit(redis, requestIdentity(req), 'watchlist');
  if (!limit.allowed) return NextResponse.json({ ok: false, error: 'rate_limited', message: 'Watchlist rate limit exceeded. Try again shortly.' }, { status: 429, headers: limit.headers });
  const parsed = parseRepoSlug(new URL(req.url).searchParams.get('slug'));
  if (!parsed) return NextResponse.json({ ok: false, error: 'invalid_repository' }, { status: 400 });
  let locked = false;
  try {
    locked = await acquireLock();
    if (!locked) return NextResponse.json({ ok: false, error: 'watchlist_busy' }, { status: 409 });
    const existing = dedupe((await redis.lrange<WatchEntry>(KEY, 0, MAX - 1)) ?? []);
    const next = existing.filter(item => item.slug !== parsed.slug);
    await redis.del(KEY);
    if (next.length) await redis.rpush(KEY, ...next);
    return NextResponse.json({ ok: true }, { headers: limit.headers });
  } catch (err) {
    console.error('watchlist DELETE error', err);
    return NextResponse.json({ ok: false, error: 'watchlist_unavailable' }, { status: 503 });
  } finally { if (locked) await releaseLock(); }
}
