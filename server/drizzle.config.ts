import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./config/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  out: './drizzle'
});