import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { Readable } from "stream";
import path from "path";
import { cloudinary, isCloudinaryConfigured } from "../utils/cloudinaryHelper.js";

// Setup multer memory storage (avoids local disk writes, completely portable in serverless containers)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default hard clamp limit
  }
});

/**
 * Clean name and remove illegal characters
 */
export function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const cleanBase = base.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${cleanBase}_${Date.now()}${ext}`;
}

/**
 * Uploads file stream buffer to Cloudinary with safe back-to-local fallback structure
 */
export async function uploadFileToCloudinary(
  fileBuffer: Buffer,
  fileType: "resume" | "document",
  filename: string
): Promise<{ publicId: string; secureUrl: string; bytes: number }> {
  const sanitized = sanitizeFilename(filename);
  const folder = fileType === "resume" ? "resumes" : "documents";

  if (!isCloudinaryConfigured) {
    // Graceful fallback for preview testing: base64 Data URI structures
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".zip": "application/zip",
    };
    const ext = path.extname(filename).toLowerCase();
    const mime = mimeMap[ext] || "application/octet-stream";
    const base64 = fileBuffer.toString("base64");
    const safeDataUrl = `data:${mime};base64,${base64}`;

    return {
      publicId: `sandbox_env/${folder}/${sanitized}`,
      secureUrl: safeDataUrl,
      bytes: fileBuffer.length,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `campus-placement/${folder}`,
        public_id: sanitized.split(".")[0],
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Stream Error:", error);
          return reject(error);
        }
        if (!result) return reject(new Error("Cloudinary returned a blank response asset."));
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          bytes: result.bytes,
        });
      }
    );

    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
}

/**
 * Delete asset from Cloudinary (ignored gracefully if running in local sandbox fallback)
 */
export async function deleteFileFromCloudinary(publicId: string): Promise<any> {
  if (!isCloudinaryConfigured || publicId.startsWith("sandbox_env/")) {
    console.log(`Sandbox environment: mock deleting file publicId "${publicId}".`);
    return { result: "ok" };
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary Delete Error:", error);
        return reject(error);
      }
      resolve(result);
    });
  });
}

/**
 * Custom file validators
 */
export function validateFile(file: Express.Multer.File, fileType: "resume" | "document") {
  if (!file || !file.buffer) {
    return { valid: false, error: "No asset payload detected inside the multipart upload form." };
  }

  const ext = path.extname(file.originalname).toLowerCase();

  if (fileType === "resume") {
    // Validate Resume: Max 5MB, PDF, DOC, DOCX
    const allowed = [".pdf", ".doc", ".docx"];
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (!allowed.includes(ext)) {
      return { valid: false, error: `Invalid file format (${ext}). Resumes must be PDF, DOC, or DOCX only.` };
    }
    if (file.size > maxBytes) {
      return { valid: false, error: `File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Resumes must not exceed 5MB.` };
    }
  } else {
    // Validate Document: Max 10MB, PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP
    const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".zip"];
    const maxBytes = 11 * 1024 * 1024; // 11MB to give small cushion for 10MB limits
    if (!allowed.includes(ext)) {
      return { valid: false, error: `Invalid file format (${ext}). Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, or ZIP.` };
    }
    if (file.size > maxBytes) {
      return { valid: false, error: `File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Supporting documents must not exceed 10MB.` };
    }
  }

  return { valid: true };
}
