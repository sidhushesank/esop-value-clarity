import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const ESOP_DOCUMENT_BUCKET =
  process.env.SUPABASE_ESOP_BUCKET || "esop-documents";

if (!supabaseUrl) {
  throw new Error(
    "Missing SUPABASE_URL environment variable."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY environment variable."
  );
}

/**
 * Server-only Supabase client for private ESOP document storage.
 *
 * Never import this file into a Client Component.
 * This client uses the Supabase service-role key.
 */
export const supabaseStorage = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Upload a private ESOP document.
 */
export async function uploadEsopDocument({
  storageKey,
  file,
  contentType,
}: {
  storageKey: string;
  file: Buffer;
  contentType: string;
}) {
  const { data, error } =
    await supabaseStorage.storage
      .from(ESOP_DOCUMENT_BUCKET)
      .upload(storageKey, file, {
        contentType,
        upsert: false,
        cacheControl: "3600",
      });

  if (error) {
    console.error(
      "[ESOP_STORAGE_UPLOAD_ERROR]",
      error
    );

    throw new Error(
      "Unable to securely store the ESOP document."
    );
  }

  return data;
}

/**
 * Download a private ESOP document on the server.
 */
export async function downloadEsopDocument(
  storageKey: string
) {
  const { data, error } =
    await supabaseStorage.storage
      .from(ESOP_DOCUMENT_BUCKET)
      .download(storageKey);

  if (error) {
    console.error(
      "[ESOP_STORAGE_DOWNLOAD_ERROR]",
      error
    );

    throw new Error(
      "Unable to retrieve the ESOP document."
    );
  }

  return data;
}

/**
 * Permanently delete an ESOP document from storage.
 */
export async function deleteEsopDocument(
  storageKey: string
) {
  const { error } =
    await supabaseStorage.storage
      .from(ESOP_DOCUMENT_BUCKET)
      .remove([storageKey]);

  if (error) {
    console.error(
      "[ESOP_STORAGE_DELETE_ERROR]",
      error
    );

    throw new Error(
      "Unable to remove the ESOP document."
    );
  }
}

/**
 * Create a short-lived signed URL for secure document access.
 */
export async function createEsopDocumentSignedUrl(
  storageKey: string,
  expiresInSeconds = 300
) {
  const { data, error } =
    await supabaseStorage.storage
      .from(ESOP_DOCUMENT_BUCKET)
      .createSignedUrl(
        storageKey,
        expiresInSeconds
      );

  if (error) {
    console.error(
      "[ESOP_STORAGE_SIGNED_URL_ERROR]",
      error
    );

    throw new Error(
      "Unable to create temporary document access."
    );
  }

  return data.signedUrl;
}