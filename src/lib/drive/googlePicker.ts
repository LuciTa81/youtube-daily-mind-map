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
  DocsView: new (viewId: string) => {
    setIncludeFolders: (value: boolean) => GooglePickerDocsView;
    setSelectFolderEnabled: (value: boolean) => GooglePickerDocsView;
    setMimeTypes: (mimeTypes: string) => GooglePickerDocsView;
  };
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
  setOAuthToken: (accessToken: string) => GooglePickerBuilder;
  setCallback: (callback: (data: PickerData) => void) => GooglePickerBuilder;
  build: () => {
    setVisible: (visible: boolean) => void;
  };
};

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void;
    };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
        };
      };
      picker?: GooglePickerNamespace;
    };
  }
}

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GIS_SCRIPT_ID = "google-identity-services-script";
const PICKER_SCRIPT_ID = "google-picker-api-script";
const DRIVE_PICKER_MIME_TYPES = [
  "application/zip",
  "application/x-zip",
  "application/x-zip-compressed",
  "application/json",
  "text/html"
].join(",");

function loadScript(id: string, src: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 Google Drive를 연결할 수 있습니다."));
  }

  const existing = document.getElementById(id);
  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google 연결 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

async function loadGoogleIdentityServices(): Promise<void> {
  await loadScript(GIS_SCRIPT_ID, "https://accounts.google.com/gsi/client");

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google 로그인 모듈을 초기화하지 못했습니다.");
  }
}

async function loadGooglePicker(): Promise<GooglePickerNamespace> {
  await loadScript(PICKER_SCRIPT_ID, "https://apis.google.com/js/api.js");

  if (!window.gapi) {
    throw new Error("Google Picker 모듈을 불러오지 못했습니다.");
  }

  await new Promise<void>((resolve) => {
    window.gapi?.load("picker", resolve);
  });

  if (!window.google?.picker) {
    throw new Error("Google Picker를 초기화하지 못했습니다.");
  }

  return window.google.picker;
}

function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }

        if (!response.access_token) {
          reject(new Error("Google Drive 접근 토큰을 받지 못했습니다."));
          return;
        }

        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message || error.type || "Google 인증 창이 닫혔습니다."));
      }
    });

    tokenClient?.requestAccessToken({ prompt: "consent" });
  });
}

function getStringValue(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getPickedDocument(data: PickerData, picker: GooglePickerNamespace): Pick<DriveFileMetadata, "id" | "name" | "mimeType"> | undefined {
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
    const view = new picker.DocsView(picker.ViewId.DOCS)
      .setIncludeFolders(false)
      .setSelectFolderEnabled(false)
      .setMimeTypes(DRIVE_PICKER_MIME_TYPES);

    const pickerInstance = new picker.PickerBuilder()
      .setAppId(config.appId)
      .setDeveloperKey(config.apiKey)
      .setOAuthToken(accessToken)
      .addView(view)
      .setCallback((data) => {
        const action = getStringValue(data, picker.Response.ACTION);
        if (action === picker.Action.CANCEL) {
          resolve(undefined);
          return;
        }

        if (action !== picker.Action.PICKED) {
          return;
        }

        const pickedDocument = getPickedDocument(data, picker);
        if (!pickedDocument) {
          reject(new Error("선택한 Drive 파일 정보를 읽지 못했습니다."));
          return;
        }

        resolve(pickedDocument);
      })
      .build();

    pickerInstance.setVisible(true);
  });
}

export async function pickGoogleDriveFile(config: GoogleDrivePickerConfig): Promise<PickedDriveFile | undefined> {
  await loadGoogleIdentityServices();
  const picker = await loadGooglePicker();
  const accessToken = await requestAccessToken(config.clientId);
  const pickedDocument = await openPicker(picker, config, accessToken);

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
