import dotenv from "dotenv";
import path from "path";

// Keep compatible with CJS build (dist/server.cjs via esbuild).
// In CJS, __dirname is available.
const envPath = path.resolve(__dirname, "../../.env");


/**
 * Must run before any module that reads process.env (e.g. cloudinaryHelper).
 * In Render/production, environment variables come from Render dashboard,
 * so do not require a local .env file.
 */
const isProduction = process.env.NODE_ENV === "production";
if (!isProduction) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn(`Could not load .env from ${envPath}: ${result.error.message}`);
  }
} else {
  // no-op in production
}

