import { db, AUDIT_COLLECTION } from '../config/firebase.js';
import { CivicIntakePayload } from '../schemas/intake.schema.js';

export interface DispatchResult {
  success: boolean;
  docId?: string;
  error?: string;
}

export async function processCivicDispatch(payload: CivicIntakePayload): Promise<DispatchResult> {
  try {
    const docRef = db.collection(AUDIT_COLLECTION).doc();
    const auditRecord = {
      docId: docRef.id,
      ...payload,
      status: 'VERIFIED_AND_QUEUED',
      processedAt: new Date().toISOString(),
      relayerStatus: 'PENDING_EIP712_SIGNATURE',
    };

    // Commit immutable audit record to Firestore
    await docRef.set(auditRecord);

    console.log(`[BEAST-DISPATCHER] Successfully validated and stored intake record: ${docRef.id}`);

    // TODO: Trigger downstream beast3-gasless-relayer-bridge webhook or Cloud Task here
    
    return { success: true, docId: docRef.id };
  } catch (error: any) {
    console.error('[BEAST-DISPATCHER] Error processing civic dispatch payload:', error);
    return { success: false, error: error.message || 'Unknown persistence error' };
  }
}
