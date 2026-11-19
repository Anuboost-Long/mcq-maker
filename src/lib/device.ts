import 'server-only';
import { cookies } from 'next/headers';

export const DEVICE_COOKIE = 'device_id';

export const isUuid = (value: string | undefined): value is string =>
	value !== undefined &&
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function currentDeviceId() {
	const id = (await cookies()).get(DEVICE_COOKIE)?.value;
	if (!isUuid(id)) throw new Error('Missing device id.');
	return id;
}
