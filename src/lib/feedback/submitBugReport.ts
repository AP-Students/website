import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface SubmitBugReportParams {
  title: string;
  bugType: string;
  bugUrl: string;
  message: string;
  email: string;
  attachedImage?: File | null;
}

interface BugReportDoc {
  type: 'bug';
  title: string;
  message: string;
  email: string;
  bugType: string;
  bugUrl: string;
  createdAt: Timestamp;
  attachedImage?: string;
}

export async function submitBugReport({
  title,
  bugType,
  bugUrl,
  message,
  email,
  attachedImage,
}: SubmitBugReportParams): Promise<string> {
  const payload: BugReportDoc = {
    type: 'bug',
    title,
    message,
    email,
    bugType,
    bugUrl,
    createdAt: serverTimestamp() as Timestamp,
  };

  if (attachedImage) {
    const imageRef = ref(storage, `feedbackImages/${Date.now()}-${attachedImage.name}`);
    await uploadBytes(imageRef, attachedImage);
    payload.attachedImage = await getDownloadURL(imageRef);
  }

  const docRef = await addDoc(collection(db, 'feedback'), payload);
  return docRef.id;
}
