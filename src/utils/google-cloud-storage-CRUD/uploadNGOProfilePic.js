import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// 1. Setup Storage (Smart Mode)
// We create a config object. If the key file exists, we add it. 
// If not, we leave it empty and let Google try to find its own way (works on Cloud).
const storageConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
};

// Check if a key file sits in the root folder
const keyPath = path.join(process.cwd(), "service-account-key.json");

if (fs.existsSync(keyPath)) {
  console.log("🔑 Found Key File locally. Using it.");
  storageConfig.keyFilename = keyPath;
} else {
  console.log("☁️ No Key File found. Trying Default Credentials (Cloud Mode).");
}

const storage = new Storage(storageConfig);

export const uploadNgoProfilePic = async (localFilePath) => {
  try {
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    
    if (!bucketName) throw new Error("Bucket name is missing in .env");
    if (!localFilePath) return null;

    console.log(`🚀 Uploading to: ${bucketName}`);

    const [file] = await storage.bucket(bucketName).upload(localFilePath, {
      destination: `ngo-logos/${Date.now()}_${path.basename(localFilePath)}`,
      public: true,
      metadata: { contentType: 'image/jpeg' },
    });

    console.log("✅ Upload Success!");

    // Cleanup local file
    try { fs.unlinkSync(localFilePath); } catch (e) {}

    return `https://storage.googleapis.com/${bucketName}/${file.name}`;

  } catch (error) {
    console.error("❌ Cloud Upload Failed:", error.message);
    
    // Suggest the fix if it fails locally
    if (error.message.includes("Could not load the default credentials")) {
        console.error("💡 TIP: You are running locally without a Key File.");
        console.error("   Run this in terminal: 'gcloud auth application-default login'");
    }

    try { fs.unlinkSync(localFilePath); } catch (e) {}
    return null;
  }
};