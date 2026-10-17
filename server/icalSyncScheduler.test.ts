import { describe, expect, it, vi } from "vitest";
import { runIcalSyncSafely } from "./icalSyncScheduler";

describe("runIcalSyncSafely", () => {
  it("returns a successful sync result and logs it", async () => {
    const logger = { log: vi.fn(), error: vi.fn() };
    const result = await runIcalSyncSafely({
      trigger: "initial",
      sync: vi.fn().mockResolvedValue({ success: true, message: "Synced 3 blocks", blocksCreated: 3 }),
      logger,
    });

    expect(result).toEqual({ success: true, message: "Synced 3 blocks", blocksCreated: 3 });
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith("[iCalSync] Initial sync: Synced 3 blocks");
  });

  it("contains a calendar sync failure instead of allowing it to escape", async () => {
    const logger = { log: vi.fn(), error: vi.fn() };
    const result = await runIcalSyncSafely({
      trigger: "scheduled",
      sync: vi.fn().mockRejectedValue(new Error("Database access denied")),
      logger,
    });

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      "[iCalSync] Scheduled sync failed; booking service remains online: Database access denied"
    );
  });
});
