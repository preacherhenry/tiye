import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    const [api_key, rest] = process.env.CLOUDINARY_URL.replace('cloudinary://', '').split(':');
    const [api_secret, cloud_name] = rest.split('@');
    cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
        secure: true
    });
    console.log('✅ Cloudinary configured successfully');
} else {
    // Fallback if user provides individual keys
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary configured via separate API keys');
}

/**
 * Uploads a file to Cloudinary permanently.
 * Supports both disk-based (file.path) and memory-based (file.buffer) multer storage.
 * @param file The multer file object
 * @param folder The folder in Cloudinary (e.g., 'deposits', 'profiles')
 * @returns The permanent public URL of the uploaded file
 */
export const uploadFile = async (file: Express.Multer.File, folder: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        let fileBuffer: Buffer;

        if (file.buffer) {
            // memoryStorage: buffer is in RAM
            fileBuffer = file.buffer;
        } else if (file.path) {
            // diskStorage: read from temp disk path
            const fs = await import('fs');
            fileBuffer = fs.readFileSync(file.path);
            // Clean up the temp file
            try { fs.unlinkSync(file.path); } catch {}
        } else {
            return reject(new Error('File has neither buffer nor path — check multer configuration.'));
        }

        const safeFilename = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').split('.').slice(0, -1).join('.') : 'file';

        try {
            const result = await cloudinary.uploader.upload(`data:${file.mimetype || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`, {
                folder: folder,
                public_id: `${Date.now()}-${safeFilename}`,
                resource_type: 'auto'
            });
            console.log(`✅ Cloudinary upload successful: ${result.secure_url}`);
            resolve(result.secure_url);
        } catch (error) {
            console.error('❌ Cloudinary upload failed:', error);
            reject(error);
        }
    });
};
