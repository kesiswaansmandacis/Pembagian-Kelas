import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  writeBatch, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';
import { Student } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if provided
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

const STUDENTS_COLLECTION = 'students';

/**
 * Listen to real-time changes in the student collection
 */
export function subscribeToStudents(callback: (students: Student[]) => void) {
  const colRef = collection(db, STUDENTS_COLLECTION);
  return onSnapshot(colRef, (snapshot) => {
    const students: Student[] = [];
    snapshot.forEach((doc) => {
      students.push(doc.data() as Student);
    });
    callback(students);
  }, (error) => {
    console.error('Firestore subscription error:', error);
  });
}

/**
 * Save / sync the complete list of students to Firestore.
 * This will batch set new or changed students and batch delete removed students.
 */
export async function saveStudentsToFirestore(students: Student[]): Promise<void> {
  try {
    const colRef = collection(db, STUDENTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const existingIds = new Set<string>();
    
    snapshot.forEach((doc) => {
      existingIds.add(doc.id);
    });

    const batch = writeBatch(db);
    const newIds = new Set<string>();

    // 1. Add/Update students
    students.forEach((student) => {
      if (!student.nisn) return;
      const cleanNisn = student.nisn.trim();
      newIds.add(cleanNisn);
      const docRef = doc(db, STUDENTS_COLLECTION, cleanNisn);
      batch.set(docRef, {
        nisn: cleanNisn,
        name: student.name || '',
        gender: student.gender || 'Laki-laki',
        schoolOfOrigin: student.schoolOfOrigin || '',
        className: student.className || '',
        homeroomTeacher: student.homeroomTeacher || '',
        whatsappGroupLink: student.whatsappGroupLink || ''
      });
    });

    // 2. Delete students that are no longer in the list
    existingIds.forEach((id) => {
      if (!newIds.has(id)) {
        const docRef = doc(db, STUDENTS_COLLECTION, id);
        batch.delete(docRef);
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error saving students to Firestore:', error);
    throw error;
  }
}

/**
 * Reset / clear all students from Firestore
 */
export async function resetStudentsInFirestore(): Promise<void> {
  try {
    const colRef = collection(db, STUDENTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const batch = writeBatch(db);
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error resetting students in Firestore:', error);
    throw error;
  }
}
