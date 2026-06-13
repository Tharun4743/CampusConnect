import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");

/** Must run before any module that reads process.env (e.g. cloudinaryHelper). */
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn(`Could not load .env from ${envPath}: ${result.error.message}`);
}
