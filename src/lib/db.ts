import { db, auth } from './firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';

export { db };

export interface Project {
  tenantId?: string;
  id?: string;
  customId?: string;
  name: string;
  location: string;
  startDate: string;
  deadline: string;
  estimatedDays: number;
  currentDay: number;
  progress: number;
  status: 'active' | 'completed' | 'delayed';
  contractValue?: number;
  createdAt: string;
}

export interface Report {
  tenantId?: string;
  id?: string;
  projectId: string;
  projectName?: string;
  projectCustomId?: string;
  userId: string;
  date: string;
  location: string;
  workerCount: number;
  issues: string;
  photoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Activity {
  tenantId?: string;
  id?: string;
  reportId: string;
  projectId: string;
  dayNumber: number;
  date: string;
  description: string;
  createdAt: string;
}

export interface Transaction {
  tenantId?: string;
  id?: string;
  referenceNo?: string;
  projectId?: string;
  projectName?: string;
  invoiceId?: string;
  payableId?: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  paymentMethod?: string;
  amount: number;
  date: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  proofUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface Invoice {
  tenantId?: string;
  id?: string;
  invoiceNo: string;
  projectId: string;
  projectName?: string;
  clientName: string;
  term: string;
  amount: number;
  paidAmount: number;
  date: string;
  dueDate: string;
  notes?: string;
  status: 'DRAFT' | 'SENT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  fileUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface Payable {
  tenantId?: string;
  id?: string;
  vendorName: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface Budget {
  tenantId?: string;
  id?: string;
  projectId: string;
  projectName?: string;
  category: string;
  plannedAmount: number;
  createdAt: string;
}

export interface AuditLog {
  tenantId?: string;
  id?: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

export interface Notification {
  tenantId?: string;
  id?: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Helper to convert file to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper to upload image (Now stores in Firebase Storage under tenant directory)
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const tenantId = userDoc.data()?.tenantId;

    if (!tenantId) throw new Error("Tenant ID not found");

    // Compression options: aggressively compress for Base64 storage
    const options = {
      maxSizeMB: 0.1, // ~100KB max
      maxWidthOrHeight: 800,
      useWebWorker: true,
      initialQuality: 0.7
    };
    
    // Compress the image
    const compressedFile = await imageCompression(file, options);
    
    // Convert to Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error("Error compressing/uploading image:", error);
    throw error;
  }
};

// Error handler
const handleFirestoreError = (error: unknown, operation: string) => {
  console.error(`Firestore Error (${operation}):`, error);
  throw error;
};
