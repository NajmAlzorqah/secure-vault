import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

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
