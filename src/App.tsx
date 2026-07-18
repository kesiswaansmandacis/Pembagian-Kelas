/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { getStudents, saveStudents, resetStudents } from './utils/storage';
import { subscribeToStudents, saveStudentsToFirestore, resetStudentsInFirestore } from './utils/firebase';
import { Student } from './types';
import StudentPortal from './components/StudentPortal';
import AdminPortal from './components/AdminPortal';
import { GraduationCap, ShieldAlert, CloudLightning } from 'lucide-react';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [view, setView] = useState<'student' | 'admin'>('student');
  const [isSyncing, setIsSyncing] = useState(true);

  // Load students on mount and subscribe to Firestore
  useEffect(() => {
    // Fast initial load from local cache
    const cachedStudents = getStudents();
    setStudents(cachedStudents);

    // Subscribe to Firestore for real-time updates across all devices
    const unsubscribe = subscribeToStudents((dbStudents) => {
      // If we got data from Firestore, update our state and cache it
      if (dbStudents.length > 0) {
        setStudents(dbStudents);
        saveStudents(dbStudents);
      } else if (cachedStudents.length > 0 && dbStudents.length === 0) {
        // Wait, if Firestore is completely empty but we have local cached students, 
        // we can seed Firestore with our local students so we don't lose them!
        // This is extremely safe and prevents data loss.
        saveStudentsToFirestore(cachedStudents).catch(console.error);
      } else {
        setStudents([]);
        saveStudents([]);
      }
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveStudents = async (newStudents: Student[]) => {
    // Optimistic UI update
    setStudents(newStudents);
    saveStudents(newStudents);
    
    // Save to Firestore so it's shared across all devices instantly
    try {
      await saveStudentsToFirestore(newStudents);
    } catch (err) {
      console.error('Failed to sync changes to database:', err);
    }
  };

  const handleResetStudents = async () => {
    setStudents([]);
    saveStudents([]);
    try {
      await resetStudentsInFirestore();
    } catch (err) {
      console.error('Failed to reset database:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Decorative background grid elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none z-0"></div>

      <main className="flex-grow flex items-center justify-center relative z-10 py-6">
        {view === 'student' ? (
          <StudentPortal students={students} />
        ) : (
          <AdminPortal 
            students={students} 
            onSaveStudents={handleSaveStudents} 
            onResetStudents={handleResetStudents}
            onBackToPortal={() => setView('student')}
          />
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="w-full bg-white border-t border-slate-150 py-4 px-6 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-primary-600" />
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">Sistem Pembagian Kelas SMAN 2 Ciamis</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[9px] font-medium text-slate-500 tracking-wider uppercase">
              {isSyncing ? 'Sinkronisasi...' : 'Database Online'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {view === 'student' ? (
            <button
              id="link-go-to-admin"
              onClick={() => setView('admin')}
              className="text-primary-600 hover:text-primary-700 font-bold transition-colors cursor-pointer flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl hover:bg-slate-100"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Masuk sebagai Panitia / Admin</span>
            </button>
          ) : (
            <button
              id="link-go-to-siswa"
              onClick={() => setView('student')}
              className="text-primary-600 hover:text-primary-700 font-bold transition-colors cursor-pointer flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl hover:bg-slate-100"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Lihat Portal Siswa</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
