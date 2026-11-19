import "server-only";
import { Redis } from "@upstash/redis";

const fromEnv = (suffix: string) =>
  Object.entries(process.env).find(([name, value]) => value && name.endsWith(suffix))?.[1];

const url = process.env.UPSTASH_REDIS_REST_URL ?? fromEnv("KV_REST_API_URL");
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? fromEnv("KV_REST_API_TOKEN");

const redis = url && token ? new Redis({ url, token }) : null;

export function sharedStore() {
  if (!redis && process.env.VERCEL) {
    throw new Error(
      "Storage is not configured: connect an Upstash Redis database (a *_KV_REST_API_URL and *_KV_REST_API_TOKEN variable).",
    );
  }
  return redis;
}
