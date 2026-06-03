import { describe, expect, it } from "vitest";
import {
  DEFAULT_USER_SETTINGS,
  clearUserSettingsFromStorage,
  readUserSettingsFromStorage,
  writeUserSettingsToStorage
} from "@/lib/storage/userSettingsRepository";

function createFakeStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    }
  };
}

describe("user settings repository", () => {
  it("uses quick share save off by default", () => {
    const storage = createFakeStorage();

    expect(readUserSettingsFromStorage(storage)).toEqual(DEFAULT_USER_SETTINGS);
    expect(readUserSettingsFromStorage(undefined)).toEqual(DEFAULT_USER_SETTINGS);
  });

  it("persists quick share save mode without changing unknown settings shape", () => {
    const storage = createFakeStorage();

    writeUserSettingsToStorage({ quickShareSaveEnabled: true }, storage);

    expect(readUserSettingsFromStorage(storage)).toEqual({ quickShareSaveEnabled: true });
  });

  it("falls back safely for malformed or partial storage values", () => {
    const malformedStorage = createFakeStorage();
    malformedStorage.setItem("youtube-daily-mind-map:user-settings:v1", "{bad-json");

    const partialStorage = createFakeStorage();
    partialStorage.setItem("youtube-daily-mind-map:user-settings:v1", JSON.stringify({ other: true }));

    expect(readUserSettingsFromStorage(malformedStorage)).toEqual(DEFAULT_USER_SETTINGS);
    expect(readUserSettingsFromStorage(partialStorage)).toEqual(DEFAULT_USER_SETTINGS);
  });

  it("can clear persisted settings", () => {
    const storage = createFakeStorage();

    writeUserSettingsToStorage({ quickShareSaveEnabled: true }, storage);
    clearUserSettingsFromStorage(storage);

    expect(readUserSettingsFromStorage(storage)).toEqual(DEFAULT_USER_SETTINGS);
  });
});
