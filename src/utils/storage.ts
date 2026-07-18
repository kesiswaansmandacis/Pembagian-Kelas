import { Student } from '../types';
import { defaultStudents } from '../data/defaultStudents';

const STORAGE_KEY = 'pancawaluya_students_data';

export function getStudents(): Student[] {
  const initialized = localStorage.getItem('pancawaluya_initialized_v5');
  if (initialized !== 'true') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStudents));
    localStorage.setItem('pancawaluya_initialized_v5', 'true');
    return defaultStudents;
  }
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStudents));
    return defaultStudents;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing student data from localStorage:', e);
    return defaultStudents;
  }
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

export function resetStudents(): Student[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStudents));
  return defaultStudents;
}
