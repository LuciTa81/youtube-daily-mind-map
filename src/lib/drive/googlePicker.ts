import { getDriveFileMetadata, type DriveFileMetadata } from "@/lib/drive/googleDriveApi";

export type GoogleDrivePickerConfig = {
  clientId: string;
  apiKey: string;
  appId: string;
};

export type PickedDriveFile = DriveFileMetadata & {
  accessToken: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GoogleTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
  error_callback?: (error: { type?: string; message?: string }) => void;
};

type PickerData = Record<string, unknown>;

type GoogleGapiLoadOptions = {
  callback: () => void;
  onerror?: (error?: unknown) => void;
  timeout?: number;
};

type GooglePickerNamespace = {
  Action: {
    PICKED: string;
    CANCEL: string;
  };
  Document: {
    ID: string;
    NAME: string;
    MIME_TYPE: string;
  };
  Response: {
    ACTION: string;
    DOCUMENTS: string;
  };
  ViewId: {
    DOCS: string;
  };
  DocsView: new (viewId: string) => GooglePickerDocsView;
  PickerBuilder: new () => GooglePickerBuilder;
};

type GooglePickerDocsView = {
  setIncludeFolders: (value: boolean) => GooglePickerDocsView;
  setSelectFolderEnabled: (value: boolean) => GooglePickerDocsView;
  setMimeTypes: (mimeTypes: string) => GooglePickerDocsView;
};

type GooglePickerBuilder = {
  addView: (view: GooglePickerDocsView) => GooglePickerBuilder;
  setAppId: (appId: string) => GooglePickerBuilder;
  setDeveloperKey: (apiKey: string) => GooglePickerBuilder;
  setOrigin?: (origin: string) => GooglePickerBuilder;
  setOAuthToken: (accessToken: string) => GooglePickerBuilder;
  setCallback: (callback: (data: PickerData) => void) => GooglePickerBuilder;
  build: () => {
    setVisible: (visible: boolean) => void;
  };
};

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callbackOrOptions: (() => void) | GoogleGapiLoadOptions) => void;
    };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
        };
      };
      picker?: GooglePickerNamespace;
    };
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    };
  }
}

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GIS_SCRIPT_ID = "google-identity-services-script";
const PICKER_SCRIPT_ID = "google-picker-api-script";
const SCRIPT_LOAD_TIMEOUT_MS = 15000;
const GOOGLE_PICKER_LOAD_TIMEOUT_MS = 15000;
const TOKEN_REQUEST_TIMEOUT_MS = 45000;
const DRIVE_PICKER_MIME_TYPES = [
  "application/zip",
  "application/x-zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "application/json",
  "text/html"
].join(",");

const scriptLoadPromises = new Map<string, Promise<void>>();

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function normalizeConfig(config: GoogleDrivePickerConfig): GoogleDrivePickerConfig {
  return {
    clientId: config.clientId.trim(),
    apiKey: config.apiKey.trim(),
    appId: config.appId.trim()
  };
}

function isNativeCapacitorRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.Capacitor?.isNativePlatform?.());
}

function assertGoogleDriveConfig(config: GoogleDrivePickerConfig) {
  const missing = [
    ["NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID", config.clientId],
    ["NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY", config.apiKey],
    ["NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID", config.appId]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Google Drive 가져오기 설정이 비어 있습니다. Vercel 환경 변수 ${missing.join(", ")}를 확인해주세요.`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function appendCacheBuster(src: string): string {
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}retry=${Date.now()}`;
}

function loadScriptAttempt(id: string, src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Google 연결 스크립트를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });
}

async function loadScriptWithRetry(id: string, src: string): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    document.getElementById(id)?.remove();

    try {
      await withTimeout(
        loadScriptAttempt(id, attempt === 0 ? src : appendCacheBuster(src)),
        SCRIPT_LOAD_TIMEOUT_MS,
        "Google 연결 스크립트 로딩 시간이 초과되었습니다. 네트워크 상태를 확인해주세요."
      );
      return;
    } catch (error) {
      lastError = error;
      await delay(300);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Google 연결 스크립트를 불러오지 못했습니다.");
}

function loadScript(id: string, src: string, isReady?: () => boolean): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 Google Drive를 연결할 수 있습니다."));
  }

  if (isReady?.()) {
    return Promise.resolve();
  }

  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") {
    return Promise.resolve();
  }

  const pending = scriptLoadPromises.get(id);
  if (pending) {
    return pending;
  }

  const promise = loadScriptWithRetry(id, src).catch((error) => {
    scriptLoadPromises.delete(id);
    throw error;
  });

  scriptLoadPromises.set(id, promise);
  return promise;
}

function loadGapiPicker(): Promise<void> {
  if (!window.gapi) {
    return Promise.reject(new Error("Google Picker 모듈을 불러오지 못했습니다."));
  }

  return withTimeout(
    new Promise<void>((resolve, reject) => {
      window.gapi?.load("picker", {
        callback: resolve,
        onerror: () => reject(new Error("Google Picker 모듈을 초기화하지 못했습니다.")),
        timeout: GOOGLE_PICKER_LOAD_TIMEOUT_MS
      });
    }),
    GOOGLE_PICKER_LOAD_TIMEOUT_MS,
    "Google Picker 초기화 시간이 초과되었습니다. 잠시 뒤 다시 시도해주세요."
  );
}

async function loadGoogleIdentityServices(): Promise<void> {
  await loadScript(GIS_SCRIPT_ID, "https://accounts.google.com/gsi/client", () =>
    Boolean(window.google?.accounts?.oauth2)
  );

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google 로그인 모듈을 초기화하지 못했습니다.");
  }
}

async function loadGooglePicker(): Promise<GooglePickerNamespace> {
  await loadScript(PICKER_SCRIPT_ID, "https://apis.google.com/js/api.js", () => Boolean(window.gapi));
  await loadGapiPicker();

  if (!window.google?.picker) {
    throw new Error("Google Picker를 초기화하지 못했습니다.");
  }

  return window.google.picker;
}

function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;

    function settle(callback: () => void) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      callback();
    }

    const timeoutId = setTimeout(() => {
      settle(() => reject(new Error("Google 인증 응답 시간이 초과되었습니다. 다시 시도해주세요.")));
    }, TOKEN_REQUEST_TIMEOUT_MS);

    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response) => {
        if (response.error) {
          settle(() => reject(new Error(response.error_description || response.error || "Google 인증에 실패했습니다.")));
          return;
        }

        const accessToken = response.access_token;
        if (!accessToken) {
          settle(() => reject(new Error("Google Drive 접근 토큰을 받지 못했습니다.")));
          return;
        }

        settle(() => resolve(accessToken));
      },
      error_callback: (error) => {
        settle(() => reject(new Error(error.message || error.type || "Google 인증 창이 닫혔습니다.")));
      }
    });

    if (!tokenClient) {
      settle(() => reject(new Error("Google 인증 클라이언트를 만들지 못했습니다.")));
      return;
    }

    try {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (error) {
      settle(() => reject(error instanceof Error ? error : new Error("Google 인증 요청을 시작하지 못했습니다.")));
    }
  });
}

function getStringValue(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getPickedDocument(
  data: PickerData,
  picker: GooglePickerNamespace
): Pick<DriveFileMetadata, "id" | "name" | "mimeType"> | undefined {
  const docsValue = data[picker.Response.DOCUMENTS];
  if (!Array.isArray(docsValue) || docsValue.length === 0) {
    return undefined;
  }

  const firstDoc = docsValue[0];
  if (!firstDoc || typeof firstDoc !== "object") {
    return undefined;
  }

  const doc = firstDoc as Record<string, unknown>;
  const id = getStringValue(doc, picker.Document.ID);
  const name = getStringValue(doc, picker.Document.NAME) ?? "Drive Takeout 파일";
  const mimeType = getStringValue(doc, picker.Document.MIME_TYPE);

  return id ? { id, name, mimeType } : undefined;
}

function openPicker(
  picker: GooglePickerNamespace,
  config: GoogleDrivePickerConfig,
  accessToken: string
): Promise<Pick<DriveFileMetadata, "id" | "name" | "mimeType"> | undefined> {
  return new Promise((resolve, reject) => {
    let settled = false;

    function settle(callback: () => void) {
      if (settled) {
        return;
      }
      settled = true;
      callback();
    }

    const view = new picker.DocsView(picker.ViewId.DOCS)
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false)
      .setMimeTypes(DRIVE_PICKER_MIME_TYPES);

    const pickerBuilder = new picker.PickerBuilder()
      .setAppId(config.appId)
      .setDeveloperKey(config.apiKey)
      .setOAuthToken(accessToken)
      .addView(view)
      .setCallback((data) => {
        const action = getStringValue(data, picker.Response.ACTION);
        if (action === picker.Action.CANCEL) {
          settle(() => resolve(undefined));
          return;
        }

        if (action !== picker.Action.PICKED) {
          return;
        }

        const pickedDocument = getPickedDocument(data, picker);
        if (!pickedDocument) {
          settle(() => reject(new Error("선택한 Drive 파일 정보를 읽지 못했습니다.")));
          return;
        }

        settle(() => resolve(pickedDocument));
      });

    if (typeof pickerBuilder.setOrigin === "function" && window.location.origin) {
      pickerBuilder.setOrigin(window.location.origin);
    }

    const pickerInstance = pickerBuilder.build();
    pickerInstance.setVisible(true);
  });
}

export async function pickGoogleDriveFile(config: GoogleDrivePickerConfig): Promise<PickedDriveFile | undefined> {
  if (isNativeCapacitorRuntime()) {
    throw new Error(
      "Android 앱에서는 Google Drive 로그인 스크립트가 막힐 수 있습니다. 위의 기기/Drive ZIP 선택으로 파일 앱이나 Drive 앱에서 Takeout ZIP을 선택해주세요."
    );
  }

  const normalizedConfig = normalizeConfig(config);
  assertGoogleDriveConfig(normalizedConfig);

  await loadGoogleIdentityServices();
  const picker = await loadGooglePicker();
  const accessToken = await requestAccessToken(normalizedConfig.clientId);
  const pickedDocument = await openPicker(picker, normalizedConfig, accessToken);

  if (!pickedDocument) {
    return undefined;
  }

  const metadata = await getDriveFileMetadata(accessToken, pickedDocument.id);

  return {
    ...metadata,
    name: metadata.name || pickedDocument.name,
    mimeType: metadata.mimeType || pickedDocument.mimeType,
    accessToken
  };
}
