import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  WATCH_HISTORY_STORAGE_SCHEMA_VERSION,
  migrateStoredWatchHistoryRecord,
  type StoredWatchHistory
} from "@/lib/storage/watchHistoryRepository";
import type { WatchItem } from "@/types/watch";

const fixedNow = () => "2026-06-03T00:00:00.000Z";
const androidSmokeChecklistPath = join(process.cwd(), "docs", "checklists", "android-smoke-test.md");
const preReleaseChecklistPath = join(process.cwd(), "docs", "checklists", "pre-release-change-summary.md");

function watchItem(overrides: Partial<WatchItem> = {}): WatchItem {
  return {
    id: "watch-1",
    title: "Shared React hooks video",
    url: "https://youtu.be/shared001",
    watchedAt: "2026-06-02T13:30:00.000Z",
    source: "manual",
    memoryTag: "remember",
    memoryNote: "Review before project work",
    memoryUpdatedAt: "2026-06-02T13:40:00.000Z",
    ...overrides
  };
}

describe("watch history storage migration", () => {
  it("upgrades legacy records while preserving shared-memory fields", () => {
    const legacyRecord = {
      id: "watch-history",
      items: [
        watchItem({
          id: "shared-video",
          memoryTag: "review",
          memoryNote: "Keep this note",
          memoryUpdatedAt: "2026-06-02T13:45:00.000Z"
        })
      ],
      updatedAt: "2026-06-02T14:00:00.000Z"
    };

    const migration = migrateStoredWatchHistoryRecord(legacyRecord, fixedNow);

    expect(migration.needsSave).toBe(true);
    expect(migration.record).toMatchObject({
      id: "watch-history",
      schemaVersion: WATCH_HISTORY_STORAGE_SCHEMA_VERSION,
      updatedAt: "2026-06-02T14:00:00.000Z"
    });
    expect(migration.record?.items).toHaveLength(1);
    expect(migration.record?.items[0]).toMatchObject({
      id: "shared-video",
      memoryTag: "review",
      memoryNote: "Keep this note",
      memoryUpdatedAt: "2026-06-02T13:45:00.000Z"
    });
  });

  it("keeps current schema records unchanged", () => {
    const currentRecord: StoredWatchHistory = {
      id: "watch-history",
      schemaVersion: WATCH_HISTORY_STORAGE_SCHEMA_VERSION,
      items: [watchItem()],
      updatedAt: "2026-06-02T14:00:00.000Z"
    };

    const migration = migrateStoredWatchHistoryRecord(currentRecord, fixedNow);

    expect(migration.needsSave).toBe(false);
    expect(migration.record).toBe(currentRecord);
  });

  it("falls back safely for invalid or partial records", () => {
    expect(migrateStoredWatchHistoryRecord(undefined, fixedNow)).toEqual({ needsSave: false });

    const migration = migrateStoredWatchHistoryRecord({ id: "watch-history" }, fixedNow);

    expect(migration.needsSave).toBe(true);
    expect(migration.record).toEqual({
      id: "watch-history",
      schemaVersion: WATCH_HISTORY_STORAGE_SCHEMA_VERSION,
      items: [],
      updatedAt: "2026-06-03T00:00:00.000Z"
    });
  });
});

describe("watch history migration smoke checklist", () => {
  it("keeps the legacy IndexedDB migration smoke path explicit", () => {
    const checklist = readFileSync(androidSmokeChecklistPath, "utf8");

    expect(checklist).toContain("## Storage Migration Smoke");
    expect(checklist).toContain("Inject a legacy `watch-history` object-store record");
    expect(checklist).toContain("but no `schemaVersion`");
    expect(checklist).toContain("`memoryTag`, `memoryNote`, and `memoryUpdatedAt`");
    expect(checklist).toContain("without clearing app data");
    expect(checklist).toContain("loads the legacy record instead of falling back to sample-only data");
    expect(checklist).toContain("now contains the current schema version");
    expect(checklist).toContain("no watch-history titles, URLs, notes, local paths, or Drive file names were printed to logs");
  });

  it("keeps pre-release risk wording aligned with the migration guardrail", () => {
    const checklist = readFileSync(preReleaseChecklistPath, "utf8");

    expect(checklist).toContain("Watch-history storage migration now has unit-level guardrails and a documented smoke path");
    expect(checklist).toContain("actual legacy-device migration smoke is still pending");
    expect(checklist).toContain("record-level schema version and legacy-record migration guard");
  });
});
