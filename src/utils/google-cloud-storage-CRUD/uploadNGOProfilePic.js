import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// --- Storage Configuration (Smart Mode) ---
// 1. Checks for a local key file (for development).
// 2. If not found, defaults to Cloud credentials (for production/App Engine).
const storageConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
};

const keyPath = path.join(process.cwd(), "service-account-key.json");

if (fs.existsSync(keyPath)) {
  storageConfig.keyFilename = keyPath;
}

const storage = new Storage(storageConfig);

/**
 * Uploads a local file to Google Cloud Storage.
 * @param {string} localFilePath - The path to the file on the server.
 * @returns {Promise<string|null>} - The public URL of the uploaded file or null on failure.
 */
export const uploadNgoProfilePic = async (localFilePath) => {
  try {
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;

    if (!bucketName) {
      throw new Error("GOOGLE_CLOUD_BUCKET_NAME is missing in .env");
    }
    if (!localFilePath) return null;

    // Generate a unique destination name
    const destination = `ngo-logos/${Date.now()}_${path.basename(localFilePath)}`;

    // Upload the file
    // Note: 'public: true' is omitted to support Uniform Bucket-Level Access.
    // Ensure 'allUsers' have 'Storage Object Viewer' permission in Cloud Console.
    const [file] = await storage.bucket(bucketName).upload(localFilePath, {
      destination: destination,
      metadata: { contentType: "image/jpeg" },
    });

    // Clean up local temp file
    try {
      fs.unlinkSync(localFilePath);
    } catch (e) {
      // Ignore deletion errors
    }

    // Return the URL
    return `https://storage.googleapis.com/${bucketName}/${file.name}`;

  } catch (error) {
    console.error("Cloud Upload Error:", error.message);

    // Clean up local temp file on error
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (e) {
        // Ignore deletion errors
      }
    }
    return null;
  }
};