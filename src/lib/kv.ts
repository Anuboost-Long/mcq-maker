import 'server-only';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

export function sharedStore() {
	if (!redis && process.env.VERCEL) {
		throw new Error(
			'Storage is not configured: set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
		);
	}
	return redis;
}
