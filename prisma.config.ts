import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load environment variables from .env.local for local development
dotenv.config({ path: path.join(__dirname, ".env.local") });
// Fallback to standard .env
dotenv.config();

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
