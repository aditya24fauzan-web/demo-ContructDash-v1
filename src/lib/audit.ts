import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export const logActivity = async (
  tenantId: string | undefined, 
  userId: string, 
  userName: string, 
  action: string, 
  entity: string, 
  details: string,
  entityId?: string
) => {
  if (!tenantId) return;
  try {
    await addDoc(collection(db, 'auditLogs'), {
      tenantId,
      userId,
      userName,
      action,
      entity,
      entityId: entityId || null,
      details,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
