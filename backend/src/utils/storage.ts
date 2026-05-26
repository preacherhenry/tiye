import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
// It will automatically pick up CLOUDINARY_URL if it's set in the environment.
if (process.env.CLOUDINARY_URL) {
    console.log('✅ Cloudinary configured automatically via CLOUDINARY_URL');
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

        const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').split('.').slice(0, -1).join('.');

        // Create an upload stream to Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: `${Date.now()}-${safeFilename}`,
                resource_type: 'auto' // Automatically detect if it's an image, video, or raw file (PDF)
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload failed:', error);
                    return reject(error);
                }
                if (result && result.secure_url) {
                    console.log(`✅ Cloudinary upload successful: ${result.secure_url}`);
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Unknown Cloudinary upload error'));
                }
            }
        );

        // Pipe the buffer into the stream
        const { Readable } = require('stream');
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null); // End of stream
        readableStream.pipe(uploadStream);
    });
};
