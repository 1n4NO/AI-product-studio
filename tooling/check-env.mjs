#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const envLocalPath = path.join(cwd, ".env.local");

const requiredKeys = [
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_API_BASE_URL"
];

if (fs.existsSync(envLocalPath)) {
  const raw = fs.readFileSync(envLocalPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const [k, ...rest] = trimmed.split("=");
    if (!process.env[k]) {
      process.env[k] = rest.join("=").trim();
    }
  }
}

const missing = requiredKeys.filter((k) => !process.env[k] || !process.env[k].trim());
if (missing.length > 0) {
  console.error("Environment validation failed.");
  console.error("Missing required variables:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const validEnvs = new Set(["development", "staging", "production"]);
if (!validEnvs.has(process.env.NEXT_PUBLIC_APP_ENV)) {
  console.error("Environment validation failed.");
  console.error("NEXT_PUBLIC_APP_ENV must be one of: development, staging, production");
  process.exit(1);
}

console.log("Environment validation passed.");
