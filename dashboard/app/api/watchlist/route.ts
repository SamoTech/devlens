import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

const KEY = "devlens:watchlist";
const MAX = 100;

export interface WatchEntry {
  slug: string;
  score: number;
  description: string | null;
  language: string | null;
  savedAt: string;
}

export async function GET() {
  try {
    const list = await redis.lrange<WatchEntry>(KEY, 0, MAX - 1);
    return NextResponse.json({ list: list ?? [] });
  } catch (err) {
    console.error("watchlist GET error", err);
    return NextResponse.json({ list: [] });
  }
}

export async function POST(req: Request) {
  try {
    const entry: WatchEntry = await req.json();
    if (!entry?.slug) return NextResponse.json({ ok: false }, { status: 400 });

    // Remove duplicate slug
    const existing = await redis.lrange<WatchEntry>(KEY, 0, MAX - 1);
    for (const item of existing ?? []) {
      if (item?.slug === entry.slug) {
        await redis.lrem(KEY, 0, item);
      }
    }

    // Push to front, trim to MAX
    await redis.lpush(KEY, entry);
    await redis.ltrim(KEY, 0, MAX - 1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("watchlist POST error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

    const existing = await redis.lrange<WatchEntry>(KEY, 0, MAX - 1);
    for (const item of existing ?? []) {
      if (item?.slug === slug) {
        await redis.lrem(KEY, 0, item);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("watchlist DELETE error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
