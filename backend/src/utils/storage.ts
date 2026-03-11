import { storage } from '../config/firebase';
import fs from 'fs';
import { Request } from 'express';

/**
 * Uploads a file to Firebase Storage with a local fallback.
 * @param file The multer file object
 * @param folder The folder in Firebase Storage (e.g., 'deposits', 'profiles')
 * @param req The Express request object (for fallback URL generation)
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (file: Express.Multer.File, folder: string, req: Request): Promise<string> => {
    const bucket = storage.bucket();
    const destination = `${folder}/${file.filename}`;
    const fileRef = bucket.file(destination);
    
    try {
        console.log(`🚀 Attempting Firebase upload to bucket: ${bucket.name}, destination: ${destination}`);
        
        await fileRef.save(fs.readFileSync(file.path), {
            metadata: { contentType: file.mimetype },
            public: true
        });

        const url = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        console.log(`✅ Firebase upload successful: ${url}`);
        return url;
    } catch (error: any) {
        console.error(`❌ Firebase upload FAILED for ${file.filename}:`, error.message);
        
        // Detailed error context
        if (error.code === 404) {
            console.error('   Reason: Bucket not found. Check if Firebase Storage is enabled and bucket name is correct.');
        } else if (error.code === 403) {
            console.error('   Reason: Permission denied. Check Firebase Storage rules or Service Account permissions.');
        }

        // Fallback to local URL (Served by Render, but ephemeral)
        // Force HTTPS for production reliability
        const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'https'; 
        const host = req.get('host') === 'localhost:5000' ? 'localhost:5000' : 'tiye-backend.onrender.com';
        
        const fallbackUrl = `${protocol}://${host}/uploads/${file.filename}`;
        
        console.warn(`⚠️ Using local fallback URL: ${fallbackUrl}`);
        console.warn('   Note: This file will be lost if the Render server restarts or redeploys.');
        
        return fallbackUrl;
    }
};
