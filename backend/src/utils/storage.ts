import { storage } from '../config/firebase';

/**
 * Uploads a file to Firebase Storage permanently.
 * Supports both disk-based (file.path) and memory-based (file.buffer) multer storage.
 * @param file The multer file object
 * @param folder The folder in Firebase Storage (e.g., 'deposits', 'profiles')
 * @returns The permanent public URL of the uploaded file
 */
export const uploadFile = async (file: Express.Multer.File, folder: string): Promise<string> => {
    const bucket = storage.bucket();
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const destination = `${folder}/${timestamp}-${safeFilename}`;
    const fileRef = bucket.file(destination);

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
        throw new Error('File has neither buffer nor path — check multer configuration.');
    }

    await fileRef.save(fileBuffer, {
        metadata: { contentType: file.mimetype },
        public: true,
    });

    const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    console.log(`✅ Firebase upload successful: ${url}`);
    return url;
};
