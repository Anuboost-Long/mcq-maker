import { importDocument } from '@/features/documents/import-service';

export async function POST(request: Request) {
	const file = (await request.formData()).get('file');
	if (!(file instanceof File))
		return Response.json({ ok: false, error: 'unsupported' }, { status: 400 });

	const result = await importDocument(file.name, Buffer.from(await file.arrayBuffer()));
	return Response.json(result, { status: result.ok ? 200 : 422 });
}
