import { getAuthToken } from "./authTokenProvider";

export type ExportFormat = "fdx" | "fountain";

/**
 * Downloads a script version as a file. Uses fetch directly rather than the
 * generated client so the response can be streamed to a Blob.
 */
export async function downloadVersionExport(scriptVersionId: number, format: ExportFormat): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/v1/script_versions/${scriptVersionId}/export?file_format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = `Export failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body; keep the status message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] || `script.${format}`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
