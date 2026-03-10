import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import Stripe from "stripe";
import multer from "multer";
import { getDb } from "../db";
import { bookings, payments, programs, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./notification";
import { startReminderScheduler } from "../reminderScheduler";
import { storagePut } from "../storage";
import { sendSms, isTwilioConfigured } from "../sms";
import { sendBookingConfirmation, sendBookingConfirmed, isEmailConfigured } from "../email";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── www → no-www canonical redirect ─────────────────────────────────────
  // Ensures login URLs are always consistent (no-www) regardless of how user arrives
  app.use((req, res, next) => {
    const host = req.headers.host || "";
    if (host.startsWith("www.")) {
      const newHost = host.slice(4);
      const proto = req.headers["x-forwarded-proto"] || "https";
      return res.redirect(301, `${proto}://${newHost}${req.url}`);
    }
    next();
  });

  // ─── Stripe Webhook (MUST be before body parser) ─────────────────────────
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-02-25.clover" });
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || "");
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err);
      return res.status(400).send("Webhook signature verification failed");
    }
    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id ? parseInt(session.metadata.booking_id) : null;
      const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
      if (bookingId && userId) {
        const db = await getDb();
        if (db) {
          await db.update(bookings).set({ status: "confirmed", paidAt: new Date(), stripePaymentIntentId: session.payment_intent as string }).where(eq(bookings.id, bookingId));
          await db.insert(payments).values({ bookingId, userId, amountCents: session.amount_total || 0, status: "succeeded", stripePaymentIntentId: session.payment_intent as string });

          // Notify Mario of the new booking
          try {
            const bookingRows = await db.select({
              sessionDate: bookings.sessionDate,
              totalAmountCents: bookings.totalAmountCents,
              programName: programs.name,
              programType: programs.type,
              studentName: users.name,
              studentEmail: users.email,
              studentPhone: users.phone,
            })
              .from(bookings)
              .leftJoin(programs, eq(bookings.programId, programs.id))
              .leftJoin(users, eq(bookings.userId, users.id))
              .where(eq(bookings.id, bookingId))
              .limit(1);

            const b = bookingRows[0];
            if (b) {
              const amountDollars = ((b.totalAmountCents || 0) / 100).toFixed(2);
              const dateStr = b.sessionDate ? new Date(b.sessionDate as any).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "TBD";
              const shortDateStr = b.sessionDate ? new Date(b.sessionDate as any).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";

              // Notify Mario
              await notifyOwner({
                title: `💳 Payment Confirmed: ${b.programName || b.programType || "Program"}`,
                content: `Student: ${b.studentName || "Unknown"}\nEmail: ${b.studentEmail || "N/A"}\nPhone: ${b.studentPhone || "N/A"}\nProgram: ${b.programName || b.programType || "N/A"}\nDate: ${dateStr}\nAmount Paid: $${amountDollars}`,
              });

              // Send confirmed email to student
              if (isEmailConfigured() && b.studentEmail) {
                sendBookingConfirmed({
                  toEmail: b.studentEmail,
                  toName: b.studentName || "there",
                  programLabel: b.programName || b.programType || "Session",
                  sessionDate: dateStr !== "TBD" ? dateStr : undefined,
                  bookingId,
                }).catch(() => {});
              }

              // Send confirmed SMS to student
              if (isTwilioConfigured() && b.studentPhone) {
                const smsMsg = `Hi ${b.studentName || "there"}! 🎾 Payment confirmed! Your ${b.programName || "session"}${shortDateStr ? " on " + shortDateStr : ""} is CONFIRMED. See you on the court! Questions? Call/text 401-965-5873. Reply STOP to unsubscribe.`;
                sendSms(b.studentPhone, smsMsg).catch(() => {});
              }
            }
          } catch (notifyErr) {
            console.warn("[Webhook] Failed to send owner notification:", notifyErr);
          }
        }
      }
    }
    res.json({ received: true });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── Voice Audio Upload Endpoint ─────────────────────────────────────────
  const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 16 * 1024 * 1024 }, // 16MB max
    fileFilter: (_req, file, cb) => {
      const allowed = ["audio/webm", "audio/ogg", "audio/mp4", "audio/wav", "audio/mpeg", "audio/mp3"];
      if (allowed.includes(file.mimetype) || file.mimetype.startsWith("audio/")) {
        cb(null, true);
      } else {
        cb(new Error("Only audio files are allowed"));
      }
    },
  });

  app.post("/api/voice-upload", audioUpload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }
      const suffix = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      const key = `voice-bookings/${suffix}.webm`;
      const { url } = await storagePut(key, req.file.buffer, req.file.mimetype || "audio/webm");
      return res.json({ url });
    } catch (err) {
      console.error("[VoiceUpload] Error:", err);
      return res.status(500).json({ error: "Failed to upload audio" });
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start the reminder scheduler after server is up
    startReminderScheduler();
  });
}

startServer().catch(console.error);
