import { readFileSync } from "fs";
import { createRequire } from "module";
import { config } from "dotenv";

config({ path: ".env" });

const require = createRequire(import.meta.url);
const mysql = require("mysql2/promise");

const htmlContent = readFileSync("/home/ubuntu/upload/ri-tennis-academy-newsletter.html", "utf-8");
console.log(`HTML length: ${htmlContent.length} chars`);

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log("Connected to DB");

// Check if already exists
const [existing] = await conn.execute(
  "SELECT id FROM newsletters WHERE slug = ?",
  ["spring-2026"]
);

if (existing.length > 0) {
  console.log("Newsletter already exists, updating...");
  await conn.execute(
    `UPDATE newsletters SET 
      subject = ?,
      season = ?,
      htmlContent = ?,
      status = 'published',
      publishedAt = NOW(),
      updatedAt = NOW()
    WHERE slug = ?`,
    [
      "RI Tennis Academy \u2014 Spring 2026 Newsletter",
      "Spring 2026",
      htmlContent,
      "spring-2026"
    ]
  );
} else {
  console.log("Inserting new newsletter...");
  await conn.execute(
    `INSERT INTO newsletters 
      (slug, subject, season, htmlContent, status, publishedAt, includeSchedule, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 'published', NOW(), 0, NOW(), NOW())`,
    [
      "spring-2026",
      "RI Tennis Academy \u2014 Spring 2026 Newsletter",
      "Spring 2026",
      htmlContent
    ]
  );
}

const [rows] = await conn.execute("SELECT id, slug, subject, status, LENGTH(htmlContent) as htmlLen FROM newsletters WHERE slug = 'spring-2026'");
console.log("Result:", rows[0]);

await conn.end();
console.log("\u2705 Done! Visit /newsletter/spring-2026 to see it.");
