export type UserSettings = {
  quickShareSaveEnabled: boolean;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const STORAGE_KEY = "youtube-daily-mind-map:user-settings:v1";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  quickShareSaveEnabled: false
};

function normalizeUserSettings(value: unknown): UserSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_USER_SETTINGS;
  }

  const candidate = value as Partial<UserSettings>;

  return {
    quickShareSaveEnabled: candidate.quickShareSaveEnabled === true
  };
}

function getBrowserStorage(): StorageLike | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}

export function readUserSettingsFromStorage(storage = getBrowserStorage()): UserSettings {
  if (!storage) {
    return DEFAULT_USER_SETTINGS;
  }

  const rawValue = storage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return DEFAULT_USER_SETTINGS;
  }

  try {
    return normalizeUserSettings(JSON.parse(rawValue));
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export function writeUserSettingsToStorage(
  settings: UserSettings,
  storage = getBrowserStorage()
): void {
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(normalizeUserSettings(settings)));
}

export function clearUserSettingsFromStorage(storage = getBrowserStorage()): void {
  storage?.removeItem(STORAGE_KEY);
}

export interface UserSettingsRepository {
  load(): Promise<UserSettings>;
  save(settings: UserSettings): Promise<void>;
  clear(): Promise<void>;
}

export class LocalUserSettingsRepository implements UserSettingsRepository {
  async load(): Promise<UserSettings> {
    return readUserSettingsFromStorage();
  }

  async save(settings: UserSettings): Promise<void> {
    writeUserSettingsToStorage(settings);
  }

  async clear(): Promise<void> {
    clearUserSettingsFromStorage();
  }
}

export const localUserSettingsRepository = new LocalUserSettingsRepository();
