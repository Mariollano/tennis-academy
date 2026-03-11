import { readFileSync } from "fs";
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";

config({ path: ".env" });

const htmlContent = readFileSync("/home/ubuntu/upload/ri-tennis-academy-newsletter.html", "utf-8");

const conn = await createConnection(process.env.DATABASE_URL);

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
      html_content = ?,
      status = ?,
      published_at = NOW(),
      updated_at = NOW()
    WHERE slug = ?`,
    [
      "RI Tennis Academy — Spring 2026 Newsletter",
      "Spring 2026",
      htmlContent,
      "published",
      "spring-2026"
    ]
  );
  console.log("✅ Newsletter updated and published!");
} else {
  console.log("Inserting new newsletter...");
  await conn.execute(
    `INSERT INTO newsletters 
      (slug, subject, season, htmlContent, status, publishedAt, includeSchedule, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, NOW(), 0, NOW(), NOW())`,
    [
      "spring-2026",
      "RI Tennis Academy — Spring 2026 Newsletter",
      "Spring 2026",
      htmlContent,
      "published"
    ]
  );
  console.log("✅ Newsletter inserted and published!");
}

await conn.end();
console.log("Done! Visit /newsletter/spring-2026 to see it.");
