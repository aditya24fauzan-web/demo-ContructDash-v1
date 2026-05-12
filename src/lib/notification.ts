import { collection, addDoc } from 'firebase/firestore';
import { db } from './db';

export async function sendNotification(
  tenantId: string,
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    await addDoc(collection(db, 'notifications'), {
      tenantId,
      userId,
      title,
      message,
      isRead: false,
      link,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to send notification", error);
  }
}
