import dotenv from "dotenv";
import path from "path";

// Use process.cwd() to consistently find .env at the project root
// regardless of whether running from src or from the dist bundle.
const envPath = path.resolve(process.cwd(), ".env");


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

