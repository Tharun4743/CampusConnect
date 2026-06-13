import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

/** Must run before any module that reads process.env (e.g. cloudinaryHelper). */
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn(`Could not load .env from ${envPath}: ${result.error.message}`);
}
