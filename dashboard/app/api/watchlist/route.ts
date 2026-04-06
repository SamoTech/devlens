import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const KEY = "devlens:watchlist";
const MAX = 100; // keep latest 100 entries

export interface WatchEntry {
  slug: string;
  score: number;
  description: string | null;
  language: string | null;
  savedAt: string;
}

export async function GET() {
  try {
    const list = await kv.lrange<WatchEntry>(KEY, 0, MAX - 1);
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

    // Remove existing entry for same slug to avoid duplicates
    const existing = await kv.lrange<WatchEntry>(KEY, 0, MAX - 1);
    for (const item of existing ?? []) {
      if (item.slug === entry.slug) {
        await kv.lrem(KEY, 0, item);
      }
    }

    // Push to front, trim to MAX
    await kv.lpush(KEY, entry);
    await kv.ltrim(KEY, 0, MAX - 1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("watchlist POST error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
