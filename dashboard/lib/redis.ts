import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

/** Read a JSON-serializable value from the shared Redis abstraction. */
export async function getJson<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    return await client.get<T>(key)
  } catch {
    return null
  }
}

/** Write a JSON-serializable value with an optional TTL. */
export async function setJson(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
  const client = getRedis()
  if (!client) return false
  try {
    const serialized = JSON.stringify(value)
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, serialized, { ex: ttlSeconds })
    } else {
      await client.set(key, serialized)
    }
    return true
  } catch {
    return false
  }
}
