"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { currentDeviceId } from "@/lib/device";
import {
  findDocument,
  removeDocument,
  removeQuestions,
  renameDocument as saveTitle,
  setDocumentStatus,
} from "./store";

const idSchema = z.string().uuid();
const idsSchema = z.array(idSchema).max(2000);
const keysSchema = z.array(z.string().regex(/^[0-9a-f-]{36}:\d+$/i)).max(2000);

const refresh = () => revalidatePath("/", "layout");

export async function publishDocument(id: unknown) {
  const deviceId = await currentDeviceId();
  const docId = await idSchema.parseAsync(id);
  const doc = await findDocument(deviceId, docId);
  if (!doc) throw new Error("Document not found");
  if (!doc.questions.some((q) => q.status === "ready")) throw new Error("Nothing to publish");
  await setDocumentStatus(deviceId, docId, "published");
  refresh();
}

export async function unpublishDocument(id: unknown) {
  const deviceId = await currentDeviceId();
  await setDocumentStatus(deviceId, await idSchema.parseAsync(id), "draft");
  refresh();
}

export async function deleteDocument(id: unknown) {
  const deviceId = await currentDeviceId();
  await removeDocument(deviceId, await idSchema.parseAsync(id));
  refresh();
  redirect("/library");
}

export async function renameDocument(id: unknown, title: unknown) {
  const deviceId = await currentDeviceId();
  const name = (await z.string().parseAsync(title)).trim().slice(0, 120);
  if (!name) throw new Error("Invalid name");
  await saveTitle(deviceId, await idSchema.parseAsync(id), name);
  refresh();
}

export async function deleteQuestion(documentId: unknown, number: unknown) {
  const deviceId = await currentDeviceId();
  const docId = await idSchema.parseAsync(documentId);
  await removeQuestions(deviceId, docId, [await z.number().int().parseAsync(number)]);
  refresh();
}

export async function deleteQuestions(keys: unknown) {
  const deviceId = await currentDeviceId();
  const parsed = (await keysSchema.parseAsync(keys)).map((key) => {
    const [documentId, number] = key.split(":");
    return { documentId, number: Number(number) };
  });
  for (const [documentId, group] of Map.groupBy(parsed, (item) => item.documentId)) {
    await removeQuestions(
      deviceId,
      documentId,
      group.map((item) => item.number),
    );
  }
  refresh();
}

export async function deleteDocuments(ids: unknown) {
  const deviceId = await currentDeviceId();
  await Promise.all((await idsSchema.parseAsync(ids)).map((id) => removeDocument(deviceId, id)));
  refresh();
}
