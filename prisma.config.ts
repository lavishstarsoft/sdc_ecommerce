import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
import path from "path";

// Load env variables from .env.local for Prisma CLI commands
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
