import { v2 as cloudinary } from "cloudinary";

let isCloudinaryConfigured = false;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && cloudName.trim() !== "" && apiKey && apiKey.trim() !== "" && apiSecret && apiSecret.trim() !== "") {
  try {
    cloudinary.config({
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
    });
    isCloudinaryConfigured = true;
    console.log("☁️  Cloudinary successfully configured for cloud media management.");
  } catch (err) {
    console.error("❌ Failed to configure Cloudinary:", err);
  }
} else {
  console.log("🔌 Cloudinary credentials missing in .env. Falling back to local base64/filesystem storage simulation.");
}

export { cloudinary, isCloudinaryConfigured };
export default cloudinary;
