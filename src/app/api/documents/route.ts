import { importDocument } from "@/features/documents/import-service";
import { currentDeviceId } from "@/lib/device";
import type { ImportResult } from "@/features/documents/types";

const fail = (error: Extract<ImportResult, { ok: false }>["error"], status: number) =>
  Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return fail("unsupported", 400);

    const result = await importDocument(
      await currentDeviceId(),
      file.name,
      Buffer.from(await file.arrayBuffer()),
    );
    return Response.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    console.error("Document import failed", error);
    return fail("failed", 500);
  }
}
