export type IcalSyncResult = {
  success: boolean;
  message: string;
  blocksCreated: number;
};

type SyncTrigger = "initial" | "scheduled";
type SyncLogger = Pick<typeof console, "log" | "error">;

/**
 * Runs a background calendar sync without allowing a temporary sync/database
 * error to terminate the web server that handles public bookings.
 */
export async function runIcalSyncSafely({
  trigger,
  sync,
  logger = console,
}: {
  trigger: SyncTrigger;
  sync: () => Promise<IcalSyncResult>;
  logger?: SyncLogger;
}): Promise<IcalSyncResult | null> {
  const label = trigger === "initial" ? "Initial" : "Scheduled";
  logger.log(`[iCalSync] Running ${trigger} sync...`);

  try {
    const result = await sync();
    logger.log(`[iCalSync] ${label} sync: ${result.message}`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[iCalSync] ${label} sync failed; booking service remains online: ${message}`);
    return null;
  }
}
