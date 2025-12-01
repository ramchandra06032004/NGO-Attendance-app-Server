import storage from "./gcp-index.js";
import path from "path";
import fs from "fs";
export const uploadCollegeLogo = async (localFilePath) => {
    try {
        const bucketName = process.env.GCS_BUCKET_NAME;
        console.log(bucketName);
        if (!bucketName) {
            console.error("GCS_BUCKET_NAME is missing in .env file");
            return null;
        }
        const bucket = storage.bucket(bucketName);

        if (!localFilePath) return null;

        const fileName = path.basename(localFilePath);
        const destination = `logo-college/${Date.now()}_${fileName}`;

        const [file] = await bucket.upload(localFilePath, {
            destination: destination,
            //public: true,
            metadata: {
                cacheControl: "public, max-age=31536000",
            },
        });
        fs.unlinkSync(localFilePath);
        return `https://storage.googleapis.com/${bucketName}/${destination}`;
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Error uploading to GCS:", error);
        return null;
    }
};