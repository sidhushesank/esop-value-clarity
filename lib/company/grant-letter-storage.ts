import {
  ESOP_DOCUMENT_BUCKET,
  deleteEsopDocument,
  supabaseStorage,
  uploadEsopDocument,
} from "@/lib/supabase-storage";

/**
 * Grant letters live in the same private bucket as PRO documents, under
 * companies/<workspaceId>/grants/<grantId>/. Server-only.
 */

export const LETTER_MAX_BYTES = 10 * 1024 * 1024;
export const PDF_MIME = "application/pdf";

export function isPdf(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer.subarray(0, 5).toString("latin1") === "%PDF-";
}

export function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "grant-letter.pdf";
  const cleaned = base.replace(/[^A-Za-z0-9._ -]+/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (!cleaned) return "grant-letter.pdf";
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

export function letterKey(workspaceId: string, grantId: string): string {
  return ["companies", workspaceId, "grants", grantId, `letter-${Date.now()}.pdf`].join("/");
}

export async function storeLetter(key: string, buffer: Buffer) {
  await uploadEsopDocument({ storageKey: key, file: buffer, contentType: PDF_MIME });
}

export async function removeLetter(key: string) {
  try {
    await deleteEsopDocument(key);
  } catch (error) {
    // The database is already cleared; a leftover file is harmless.
    console.error("[grant-letter] delete failed:", error);
  }
}

/** Short-lived URL that downloads the file under its original name. */
export async function letterDownloadUrl(key: string, fileName: string, seconds = 60) {
  const { data, error } = await supabaseStorage.storage
    .from(ESOP_DOCUMENT_BUCKET)
    .createSignedUrl(key, seconds, { download: fileName });

  if (error || !data?.signedUrl) {
    console.error("[grant-letter] signed URL failed:", error);
    throw new Error("Unable to create temporary document access.");
  }
  return data.signedUrl;
}
