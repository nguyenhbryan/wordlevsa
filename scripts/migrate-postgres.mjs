import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Set DATABASE_URL before running npm run db:migrate.");
}

const schemaPath = fileURLToPath(
  new URL("../db/postgres-schema.sql", import.meta.url),
);
const schema = await readFile(schemaPath, "utf8");
const statements = schema
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

const sql = neon(databaseUrl);
for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} Postgres schema statements.`);
