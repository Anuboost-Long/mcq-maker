import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseMcqs } from "@/features/documents/mcq-parser/parse";
import {
  findDocument,
  findDocumentByChecksum,
  getBank,
  insertDocument,
  listDocuments,
  removeDocument,
  removeQuestions,
  renameDocument,
  setDocumentStatus,
} from "@/features/documents/store";
import { createSession } from "./quizzes/session";
import {
  clearSessions,
  deleteSessions,
  findSession,
  insertSession,
  listSessions,
  submitSession,
  updateSessionQuestion,
} from "./quizzes/store";
import { sql } from "@/lib/db";
import type { QuizConfig } from "./quizzes/types";

const lines = (n: number) => [
  `${n}. Question ${n}?`,
  "A. One",
  "B. Two",
  "C. Three",
  "D. Four",
  "Answer: B",
];

const parsed = parseMcqs([
  { kind: "paragraph", lines: ["Topic", ...lines(1), ...lines(2), ...lines(3)] },
]);

const newDoc = (checksum = randomUUID()) => ({
  filename: "x.docx",
  title: "My document",
  checksum,
  ...parsed,
});

const config: QuizConfig = {
  timing: { kind: "none" },
  documentIds: [],
  difficulty: "mixed",
  ordering: "mixed",
  mode: "exam",
  count: 3,
};

async function publishedDoc(device: string) {
  const id = await insertDocument(device, newDoc());
  await setDocumentStatus(device, id, "published");
  return id;
}

const sessionFor = async (device: string, over: Partial<QuizConfig> = {}) => {
  const id = await publishedDoc(device);
  return createSession(await getBank(device), { ...config, documentIds: [id], ...over });
};

describe("documents", () => {
  it("round-trips a document with its questions and options", async () => {
    const device = randomUUID();
    const id = await insertDocument(device, newDoc());
    const doc = await findDocument(device, id);

    expect(doc?.title).toBe("My document");
    expect(doc?.status).toBe("draft");
    expect(doc?.questions).toHaveLength(3);
    expect(doc?.questions[0].options.map((o) => o.label)).toEqual(["A", "B", "C", "D"]);
    expect(doc?.questions[0].answerLabel).toBe("B");
    expect(doc?.questions[0].section).toBe("Topic");
    expect(doc?.questions[0].issues).toEqual([]);

    const [summary] = await listDocuments(device);
    expect(summary).toMatchObject({ id, questionCount: 3, publishableCount: 3, reviewCount: 0 });
  });

  it("only publishes ready questions into the bank, with stable ids", async () => {
    const device = randomUUID();
    const id = await publishedDoc(device);
    const bank = await getBank(device);
    expect(bank).toHaveLength(3);
    expect(bank[0].documentId).toBe(id);
    expect(bank[0].options.find((o) => o.id === bank[0].correctOptionId)?.text).toBe("Two");
  });

  it("removes questions and their options, and renames", async () => {
    const device = randomUUID();
    const id = await insertDocument(device, newDoc());
    await removeQuestions(device, id, [1, 3]);
    await renameDocument(device, id, "Renamed");
    const doc = await findDocument(device, id);
    expect(doc?.questions.map((q) => q.number)).toEqual([2]);
    expect(doc?.title).toBe("Renamed");
  });

  it("detects the same file per device but allows other devices to have it", async () => {
    const a = randomUUID();
    const b = randomUUID();
    const checksum = randomUUID();
    const id = await insertDocument(a, newDoc(checksum));
    expect((await findDocumentByChecksum(a, checksum))?.id).toBe(id);
    expect(await findDocumentByChecksum(b, checksum)).toBeUndefined();
    await expect(insertDocument(a, newDoc(checksum))).rejects.toThrow();
    await expect(insertDocument(b, newDoc(checksum))).resolves.toBeTruthy();
  });
});

describe("device isolation", () => {
  it("never shows, changes or deletes another device's documents", async () => {
    const owner = randomUUID();
    const stranger = randomUUID();
    const id = await publishedDoc(owner);

    expect(await listDocuments(stranger)).toEqual([]);
    expect(await findDocument(stranger, id)).toBeUndefined();
    expect(await getBank(stranger)).toEqual([]);

    await setDocumentStatus(stranger, id, "draft");
    await renameDocument(stranger, id, "Hijacked");
    await removeQuestions(stranger, id, [1, 2, 3]);
    await removeDocument(stranger, id);

    const doc = await findDocument(owner, id);
    expect(doc?.status).toBe("published");
    expect(doc?.title).toBe("My document");
    expect(doc?.questions).toHaveLength(3);
  });

  it("only returns the requesting device's quiz sessions", async () => {
    const owner = randomUUID();
    const stranger = randomUUID();
    const session = await sessionFor(owner);
    await insertSession(owner, session);

    expect(await findSession(stranger, session.id)).toBeUndefined();
    expect(await listSessions(stranger)).toEqual([]);

    const q = session.questions[0];
    await updateSessionQuestion(stranger, session.id, q.id, { selectedOptionId: q.optionOrderIds[0] });
    await submitSession(stranger, session.id, Date.now());

    const fresh = await findSession(owner, session.id);
    expect(fresh?.submittedAt).toBeNull();
    expect(fresh?.questions[0].selectedOptionId).toBeNull();
  });
});

describe("quiz sessions", () => {
  it("stores the frozen question snapshot and option order", async () => {
    const device = randomUUID();
    const session = await sessionFor(device);
    await insertSession(device, session);

    const loaded = await findSession(device, session.id);
    expect(loaded?.questions).toHaveLength(3);
    expect(loaded?.config).toEqual(session.config);
    session.questions.forEach((q, i) => {
      expect(loaded?.questions[i].optionOrderIds).toEqual(q.optionOrderIds);
      expect(loaded?.questions[i].question.correctOptionId).toBe(q.question.correctOptionId);
    });
  });

  it("updates one answer at a time without touching the others", async () => {
    const device = randomUUID();
    const session = await sessionFor(device);
    await insertSession(device, session);
    const [first, second] = session.questions;

    await updateSessionQuestion(device, session.id, first.id, { selectedOptionId: first.optionOrderIds[1] });
    await updateSessionQuestion(device, session.id, first.id, { flagged: true });
    await updateSessionQuestion(device, session.id, second.id, { checked: true });

    const loaded = await findSession(device, session.id);
    expect(loaded?.questions[0]).toMatchObject({
      selectedOptionId: first.optionOrderIds[1],
      flagged: true,
      checked: false,
    });
    expect(loaded?.questions[1]).toMatchObject({ selectedOptionId: null, flagged: false, checked: true });
  });

  it("submits once and keeps the first submission time", async () => {
    const device = randomUUID();
    const session = await sessionFor(device);
    await insertSession(device, session);

    await submitSession(device, session.id, 1_000);
    await submitSession(device, session.id, 9_999);
    expect((await findSession(device, session.id))?.submittedAt).toBe(1_000);
  });

  it("ends an expired countdown at its deadline when loaded", async () => {
    const device = randomUUID();
    const session = await sessionFor(device, { timing: { kind: "countdown", minutes: 1 } });
    session.startedAt = Date.now() - 10 * 60_000;
    await insertSession(device, session);

    const loaded = await findSession(device, session.id);
    expect(loaded?.submittedAt).toBe(session.startedAt + 60_000);
    expect((await listSessions(device))[0].submittedAt).toBe(session.startedAt + 60_000);
  });

  it("lists newest first", async () => {
    const device = randomUUID();
    const older = await sessionFor(device);
    older.startedAt = 1_000;
    const newer = createSession(await getBank(device), { ...config, documentIds: older.config.documentIds });
    newer.startedAt = 2_000;
    await insertSession(device, older);
    await insertSession(device, newer);

    expect((await listSessions(device)).map((s) => s.id)).toEqual([newer.id, older.id]);
  });
});

describe("clearing quiz history", () => {
  const countRows = async (sessionId: string) =>
    (await sql()<{ n: number }[]>`select count(*)::int as n from quiz_session_questions where session_id = ${sessionId}`)[0].n;

  it("deletes only the chosen attempts, with their questions", async () => {
    const device = randomUUID();
    const keep = await sessionFor(device);
    const drop = createSession(await getBank(device), { ...config, documentIds: keep.config.documentIds });
    await insertSession(device, keep);
    await insertSession(device, drop);

    await deleteSessions(device, [drop.id]);

    expect(await findSession(device, drop.id)).toBeUndefined();
    expect(await countRows(drop.id)).toBe(0);
    expect((await findSession(device, keep.id))?.questions).toHaveLength(3);
  });

  it("cannot delete another device's attempts", async () => {
    const owner = randomUUID();
    const stranger = randomUUID();
    const session = await sessionFor(owner);
    await insertSession(owner, session);

    await deleteSessions(stranger, [session.id]);
    await clearSessions(stranger);

    expect(await findSession(owner, session.id)).toBeDefined();
    expect(await countRows(session.id)).toBe(3);
  });

  it("clears everything for one device and leaves others alone", async () => {
    const a = randomUUID();
    const b = randomUUID();
    await insertSession(a, await sessionFor(a));
    await insertSession(a, await sessionFor(a));
    await insertSession(b, await sessionFor(b));

    await clearSessions(a);

    expect(await listSessions(a)).toEqual([]);
    expect(await listSessions(b)).toHaveLength(1);
  });
});
