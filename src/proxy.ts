import { type NextRequest, NextResponse } from 'next/server';

const COOKIE = 'device_id';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function proxy(request: NextRequest) {
	if (UUID.test(request.cookies.get(COOKIE)?.value ?? '')) return NextResponse.next();

	const id = crypto.randomUUID();
	request.cookies.set(COOKIE, id);
	const response = NextResponse.next({ request });
	response.cookies.set({
		name: COOKIE,
		value: id,
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 60 * 60 * 24 * 400
	});
	return response;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
