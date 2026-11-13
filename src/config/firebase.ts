import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

if (!getApps().length) {
  initializeApp({
    // Cloud Run automatically injects application default credentials
    projectId: process.env.FIREBASE_PROJECT_ID || 'beast3-production',
  });
}

export const db = getFirestore();
export const AUDIT_COLLECTION = process.env.FIRESTORE_COLLECTION || 'beast3_audit_logs';
