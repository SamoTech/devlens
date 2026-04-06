import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = Redis.fromEnv();

const KEY = "devlens:org-watchlist";
const MAX = 100;

export interface OrgEntry {
  org: string;
  repoCount: number;
  avgScore: number;
  topRepo: string | null;
  savedAt: string;
}

export async function GET() {
  try {
    const list = await redis.lrange<OrgEntry>(KEY, 0, MAX - 1);
    return NextResponse.json({ list: list ?? [] });
  } catch (err) {
    console.error("org-watchlist GET error", err);
    return NextResponse.json({ list: [] });
  }
}

export async function POST(req: Request) {
  try {
    const entry: OrgEntry = await req.json();
    if (!entry?.org) return NextResponse.json({ ok: false }, { status: 400 });

    // Remove duplicate org
    const existing = await redis.lrange<OrgEntry>(KEY, 0, MAX - 1);
    for (const item of existing ?? []) {
      if (item?.org === entry.org) {
        await redis.lrem(KEY, 0, item);
      }
    }

    // Push to front, trim to MAX
    await redis.lpush(KEY, entry);
    await redis.ltrim(KEY, 0, MAX - 1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("org-watchlist POST error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
