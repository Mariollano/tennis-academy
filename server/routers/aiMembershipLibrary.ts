import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { AI_GUIDES } from "../../shared/aiMembership";
import { aiGuideAssets, aiMembershipSettings } from "../../drizzle/schema";
import { membershipDb, validatePdf, encryptGuide, newToken, requireSameSite } from "../aiMembershipSecurity";
import { storagePut } from "../storage";
import { requireActiveMember } from "./aiMembershipAccount";
import { getMembershipReadiness, connectMembershipWebhook } from "../aiMembershipReadiness";
import { getOrCreateMembershipPrice } from "../aiMembershipCatalog";

const slotSchema = z.enum(["guide-1", "guide-2", "guide-3", "guide-4", "guide-5", "new-guides"]);
export const aiMembershipLibraryRouter = router({
  library: publicProcedure.query(async ({ ctx }) => {
    ctx.res.setHeader("Cache-Control", "private, no-store");
    await requireActiveMember(ctx.req);
    const db = await membershipDb();
    const assets = await db.select().from(aiGuideAssets);
    const [settings] = await db.select().from(aiMembershipSettings).where(eq(aiMembershipSettings.id, 1)).limit(1);
    return { guides: AI_GUIDES.map(guide => ({ ...guide, available: assets.some(asset => asset.slot === guide.slot) })), promptLibrary: settings?.promptLibrary || null };
  }),
  adminLibrary: adminProcedure.query(async () => {
    const db = await membershipDb();
    const assets = await db.select().from(aiGuideAssets);
    const [settings] = await db.select().from(aiMembershipSettings).where(eq(aiMembershipSettings.id, 1)).limit(1);
    return { guides: AI_GUIDES.map(guide => ({ ...guide, filename: assets.find(asset => asset.slot === guide.slot)?.filename || null })), promptLibrary: settings?.promptLibrary || "", enabled: !!settings?.checkoutEnabled };
  }),
  readiness: adminProcedure.query(getMembershipReadiness),
  connectProduct: adminProcedure.mutation(async ({ ctx }) => {
    requireSameSite(ctx.req);
    try { return await getOrCreateMembershipPrice(); }
    catch { throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The live membership product could not be connected. Check Stripe activation and the exact $20 USD monthly price; no existing product was changed." }); }
  }),
  connectWebhook: adminProcedure.mutation(async ({ ctx }) => {
    requireSameSite(ctx.req);
    try { return await connectMembershipWebhook(); }
    catch { throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Connect an activated live Stripe key first, then retry the membership webhook connection." }); }
  }),
  uploadGuide: adminProcedure.input(z.object({ slot: slotSchema, filename: z.string().min(1).max(255), base64: z.string().max(14 * 1024 * 1024) })).mutation(async ({ input, ctx }) => {
    requireSameSite(ctx.req);
    const pdf = validatePdf(input.base64, input.filename);
    const key = `ai-member-library/${input.slot}/${newToken()}.encrypted`;
    await storagePut(key, encryptGuide(pdf), "application/octet-stream");
    const db = await membershipDb();
    const filename = input.filename.replace(/[^a-zA-Z0-9._ -]/g, "_");
    await db.insert(aiGuideAssets).values({ slot: input.slot, encryptedStorageKey: key, filename })
      .onDuplicateKeyUpdate({ set: { encryptedStorageKey: key, filename } });
    return { success: true };
  }),
  savePrompts: adminProcedure.input(z.object({ text: z.string().max(500_000) })).mutation(async ({ input, ctx }) => {
    requireSameSite(ctx.req);
    const db = await membershipDb();
    await db.insert(aiMembershipSettings).values({ id: 1, promptLibrary: input.text.trim() || null }).onDuplicateKeyUpdate({ set: { promptLibrary: input.text.trim() || null } });
    return { success: true };
  }),
  setEnrollment: adminProcedure.input(z.object({ enabled: z.boolean(), acknowledgePlaceholders: z.boolean().default(false) })).mutation(async ({ input, ctx }) => {
    requireSameSite(ctx.req);
    if (input.enabled) {
      const readiness = await getMembershipReadiness();
      if (!readiness.ready) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Enrollment stays closed until every setup check passes." });
      if (!input.acknowledgePlaceholders) throw new TRPCError({ code: "BAD_REQUEST", message: "Confirm that any unfinished guides are shown as Coming soon before opening enrollment." });
    }
    const db = await membershipDb();
    await db.insert(aiMembershipSettings).values({ id: 1, checkoutEnabled: input.enabled }).onDuplicateKeyUpdate({ set: { checkoutEnabled: input.enabled } });
    return { enabled: input.enabled };
  }),
});
