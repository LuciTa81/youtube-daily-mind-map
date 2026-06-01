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

export type DriveDownloadProgress = {
  downloadedBytes: number;
  totalBytes?: number;
};

export type DriveDownloadOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: DriveDownloadProgress) => void;
};

type GoogleDriveErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: Array<{
      reason?: string;
      message?: string;
    }>;
  };
};

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3/files";

export class DriveApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly reason?: string;

  constructor(message: string, status: number, code?: string, reason?: string) {
    super(message);
    this.name = "DriveApiError";
    this.status = status;
    this.code = code;
    this.reason = reason;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDriveErrorBody(value: unknown): GoogleDriveErrorBody | undefined {
  if (!isRecord(value) || !isRecord(value.error)) {
    return undefined;
  }

  const error = value.error;
  const errors = Array.isArray(error.errors)
    ? error.errors
        .filter(isRecord)
        .map((item) => ({
          reason: typeof item.reason === "string" ? item.reason : undefined,
          message: typeof item.message === "string" ? item.message : undefined
        }))
    : undefined;

  return {
    error: {
      code: typeof error.code === "number" ? error.code : undefined,
      message: typeof error.message === "string" ? error.message : undefined,
      status: typeof error.status === "string" ? error.status : undefined,
      errors
    }
  };
}

async function readDriveError(response: Response): Promise<DriveApiError> {
  const text = await response.text().catch(() => "");
  let body: GoogleDriveErrorBody | undefined;

  if (text) {
    try {
      body = parseDriveErrorBody(JSON.parse(text));
    } catch {
      body = undefined;
    }
  }

  const apiError = body?.error;
  const firstDetail = apiError?.errors?.[0];
  const message =
    apiError?.message ||
    firstDetail?.message ||
    text ||
    `Google Drive 요청에 실패했습니다. (${response.status})`;

  return new DriveApiError(message, response.status, apiError?.status, firstDetail?.reason);
}

async function driveFetch(accessToken: string, url: string, init?: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {})
      }
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DriveApiError("Google Drive 다운로드가 취소되었습니다.", 0, "ABORTED");
    }

    throw new DriveApiError("Google Drive에 연결하지 못했습니다. 네트워크 상태를 확인해주세요.", 0, "NETWORK_ERROR");
  }

  if (!response.ok) {
    throw await readDriveError(response);
  }

  return response;
}

function getContentLength(response: Response): number | undefined {
  const header = response.headers.get("content-length") ?? response.headers.get("Content-Length");
  if (!header) {
    return undefined;
  }

  const value = Number(header);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

async function readResponseAsArrayBuffer(
  response: Response,
  options?: DriveDownloadOptions
): Promise<ArrayBuffer> {
  const totalBytes = getContentLength(response);
  const reader = response.body?.getReader();

  if (!reader) {
    const buffer = await response.arrayBuffer();
    options?.onProgress?.({ downloadedBytes: buffer.byteLength, totalBytes });
    return buffer;
  }

  const chunks: Uint8Array[] = [];
  let downloadedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }

    chunks.push(value);
    downloadedBytes += value.byteLength;
    options?.onProgress?.({ downloadedBytes, totalBytes });
  }

  const bytes = new Uint8Array(downloadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes.buffer;
}

export function formatDriveFileSize(size?: string | number): string {
  if (size === undefined || size === "") {
    return "크기 정보 없음";
  }

  const bytes = typeof size === "number" ? size : Number(size);
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "크기 정보 없음";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function getDriveApiUserMessage(error: unknown, fallback = "Google Drive 요청을 완료하지 못했습니다."): string {
  if (!(error instanceof DriveApiError)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.status === 0) {
    return error.message;
  }

  if (error.status === 401) {
    return "Google 인증이 만료되었습니다. Drive 파일을 다시 선택해주세요.";
  }

  if (error.status === 403) {
    return "선택한 Drive 파일에 접근할 권한이 없습니다. Google Picker에서 파일을 다시 선택해주세요.";
  }

  if (error.status === 404) {
    return "선택한 Drive 파일을 찾지 못했습니다. 파일이 삭제되었는지 확인해주세요.";
  }

  if (error.status === 429) {
    return "Google Drive 요청이 너무 많습니다. 잠시 뒤 다시 시도해주세요.";
  }

  return `${fallback} (${error.status}) ${error.message}`;
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

export async function downloadDriveFile(
  accessToken: string,
  fileId: string,
  options?: DriveDownloadOptions
): Promise<ArrayBuffer> {
  const url = `${DRIVE_API_BASE_URL}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
  const response = await driveFetch(accessToken, url, { signal: options?.signal });

  return readResponseAsArrayBuffer(response, options);
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
