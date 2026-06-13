import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

function initCloudinary(): boolean {
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudinaryUrl) {
    process.env.CLOUDINARY_URL = cloudinaryUrl;
    cloudinary.config({ secure: true });
    return true;
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }

  return false;
}

const isCloudinaryConfigured = initCloudinary();

if (isCloudinaryConfigured) {
  console.log("Cloudinary: Connected successfully");
} else {
  console.warn("Cloudinary: Credentials missing. Using local file storage.");
  console.warn("Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env");
}

export async function uploadFile(
  buffer: Buffer,
  options: { folder: string; filename: string; mimeType: string }
): Promise<{ url: string; publicId: string; size: number }> {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `campus-placement/${options.folder}`,
          public_id: options.filename.split(".")[0],
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
            size: result!.bytes,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  const uploadsDir = path.join(process.cwd(), "uploads", options.folder);
  fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `${Date.now()}_${options.filename}`;
  const filepath = path.join(uploadsDir, filename);
  fs.writeFileSync(filepath, buffer);

  return {
    url: `/uploads/${options.folder}/${filename}`,
    publicId: `${options.folder}/${filename}`,
    size: buffer.length,
  };
}

export async function deleteFile(publicId: string): Promise<void> {
  if (isCloudinaryConfigured) {
    await cloudinary.uploader.destroy(publicId);
    return;
  }

  const filepath = path.join(process.cwd(), "uploads", publicId);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

export { cloudinary, isCloudinaryConfigured };
export default cloudinary;
