export type DriveFileCapabilities = {
  canTrash?: boolean;
  canDelete?: boolean;
};

export type DriveFileMetadata = {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  webViewLink?: string;
  trashed?: boolean;
  capabilities?: DriveFileCapabilities;
};

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3/files";

async function driveFetch(accessToken: string, url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Google Drive 요청에 실패했습니다. (${response.status})`);
  }

  return response;
}

export async function getDriveFileMetadata(
  accessToken: string,
  fileId: string
): Promise<DriveFileMetadata> {
  const fields = [
    "id",
    "name",
    "mimeType",
    "size",
    "webViewLink",
    "trashed",
    "capabilities/canTrash",
    "capabilities/canDelete"
  ].join(",");
  const url = `${DRIVE_API_BASE_URL}/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(
    fields
  )}&supportsAllDrives=true`;
  const response = await driveFetch(accessToken, url);

  return (await response.json()) as DriveFileMetadata;
}

export async function downloadDriveFile(accessToken: string, fileId: string): Promise<ArrayBuffer> {
  const url = `${DRIVE_API_BASE_URL}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
  const response = await driveFetch(accessToken, url);

  return response.arrayBuffer();
}

export async function trashDriveFile(accessToken: string, fileId: string): Promise<DriveFileMetadata> {
  const url = `${DRIVE_API_BASE_URL}/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(
    "id,name,trashed,capabilities/canTrash,capabilities/canDelete"
  )}&supportsAllDrives=true`;
  const response = await driveFetch(accessToken, url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ trashed: true })
  });

  return (await response.json()) as DriveFileMetadata;
}
