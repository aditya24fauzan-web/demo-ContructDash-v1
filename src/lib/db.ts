import { db } from './firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';

export { db };

export interface Project {
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
  id?: string;
  reportId: string;
  projectId: string;
  dayNumber: number;
  date: string;
  description: string;
  createdAt: string;
}

export interface Transaction {
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
  id?: string;
  projectId: string;
  projectName?: string;
  category: string;
  plannedAmount: number;
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

// Helper to upload image (Now converts to Base64 and stores in Firestore)
export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    // Compression options: Max 300KB to ensure it fits well in Firestore document limits (1MB)
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1024,
      useWebWorker: false
    };
    
    // Compress the image
    const compressedFile = await imageCompression(file, options);
    
    // Convert to Base64 string
    const base64String = await fileToBase64(compressedFile);
    
    return base64String;
  } catch (error) {
    console.error("Error compressing/converting image:", error);
    throw error;
  }
};

// Error handler
const handleFirestoreError = (error: unknown, operation: string) => {
  console.error(`Firestore Error (${operation}):`, error);
  throw error;
};
