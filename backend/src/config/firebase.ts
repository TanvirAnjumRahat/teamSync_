import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

console.log('🔐 Initializing Firebase Admin SDK...');

// Initialize Firebase Admin using env variables or service account JSON file
if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            console.log('📁 Loading service account from Environment Variables');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    // Replace escaped newlines with actual newlines for the private key
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            });
            console.log('✅ Firebase Admin SDK initialized successfully from ENV variables!');
        } else {
            const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
            
            // Check if file exists
            if (!fs.existsSync(serviceAccountPath)) {
                console.error('❌ serviceAccountKey.json not found at:', serviceAccountPath);
                console.error('💡 Download it from Firebase Console or set ENV variables.');
                process.exit(1);
            }
            
            console.log(`📁 Loading service account from: ${serviceAccountPath}`);
            const serviceAccount = require(serviceAccountPath);
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            
            console.log('✅ Firebase Admin SDK initialized successfully from JSON file!');
            console.log(`📁 Project ID: ${serviceAccount.project_id}`);
            console.log(`📧 Client Email: ${serviceAccount.client_email}`);
        }
    } catch (error) {
        console.error('❌ Firebase admin initialization error:', error);
        console.error('💡 Make sure serviceAccountKey.json is valid or ENV variables are correct');
        process.exit(1);
    }
}

// Export Firebase services
export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
