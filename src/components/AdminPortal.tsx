import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Users, 
  RotateCcw, 
  X, 
  Save, 
  Lock, 
  ArrowLeft,
  FileDown,
  Upload,
  UserCheck,
  Check,
  Briefcase,
  Layers,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Student } from '../types';
import * as XLSX from 'xlsx';

interface AdminPortalProps {
  students: Student[];
  onSaveStudents: (newStudents: Student[]) => void;
  onResetStudents: () => void;
  onBackToPortal: () => void;
}

const CLASS_TEACHERS: Record<string, string> = {
  'E1': 'Drs. Heri Sutrisno, M.Pd.',
  'E2': 'Dra. Sri Wahyuni, M.Si.',
  'E3': 'Budi Santoso, S.Pd.',
  'E4': 'Linda Permata, S.S., M.Hum.',
  'E5': 'Drs. H. Ahmad Sobari, M.Pd.',
  'E6': 'Endang Rukmana, S.Pd., M.M.',
  'E7': 'Hj. Neneng Hasanah, S.Pd.',
  'E8': 'Dr. Roni Wijaya, M.T.',
  'E9': 'Yayan Mulyana, S.Pd.',
  'E10': 'Cecep Hidayat, M.Si.',
  'E11': 'Tati Haryati, S.Pd.',
  'E12': 'Wawan Setiawan, M.Pd.',
};

const CLASS_WHATSAPP: Record<string, string> = {
  'E1': 'https://chat.whatsapp.com/CiamisSMAN2ClassE1',
  'E2': 'https://chat.whatsapp.com/CiamisSMAN2ClassE2',
  'E3': 'https://chat.whatsapp.com/CiamisSMAN2ClassE3',
  'E4': 'https://chat.whatsapp.com/CiamisSMAN2ClassE4',
  'E5': 'https://chat.whatsapp.com/CiamisSMAN2ClassE5',
  'E6': 'https://chat.whatsapp.com/CiamisSMAN2ClassE6',
  'E7': 'https://chat.whatsapp.com/CiamisSMAN2ClassE7',
  'E8': 'https://chat.whatsapp.com/CiamisSMAN2ClassE8',
  'E9': 'https://chat.whatsapp.com/CiamisSMAN2ClassE9',
  'E10': 'https://chat.whatsapp.com/CiamisSMAN2ClassE10',
  'E11': 'https://chat.whatsapp.com/CiamisSMAN2ClassE11',
  'E12': 'https://chat.whatsapp.com/CiamisSMAN2ClassE12',
};

export default function AdminPortal({ 
  students, 
  onSaveStudents, 
  onResetStudents, 
  onBackToPortal 
}: AdminPortalProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('Semua');

  // Modal / Form state for Create & Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formNisn, setFormNisn] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formSchoolOfOrigin, setFormSchoolOfOrigin] = useState('');
  const [formClass, setFormClass] = useState('E1');
  const [formTeacher, setFormTeacher] = useState(CLASS_TEACHERS['E1']);
  const [formWhatsapp, setFormWhatsapp] = useState(CLASS_WHATSAPP['E1']);
  const [formError, setFormError] = useState<string | null>(null);

  // Import file ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Custom Confirmation Modal State for Iframe safety
  const [pendingAction, setPendingAction] = useState<{
    type: 'delete' | 'reset' | 'import';
    payload: any;
  } | null>(null);

  const executePendingAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'delete') {
      const { nisn } = pendingAction.payload;
      const newStudents = students.filter((s) => s.nisn !== nisn);
      onSaveStudents(newStudents);
    } else if (pendingAction.type === 'reset') {
      onResetStudents();
      setImportStatus(null);
    } else if (pendingAction.type === 'import') {
      const parsedStudents = pendingAction.payload as Student[];
      const importedNisnsSet = new Set(parsedStudents.map(s => s.nisn));
      const filteredExisting = students.filter(s => !importedNisnsSet.has(s.nisn));
      const finalStudents = [...filteredExisting, ...parsedStudents];
      onSaveStudents(finalStudents);
      setImportStatus({ 
        success: true, 
        message: `Berhasil mengimpor ${parsedStudents.length} data siswa baru dari Excel.` 
      });
    }

    setPendingAction(null);
  };

  // Authenticate Admin with Andalusia password
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '@Andalusia_222') {
      setIsAdminAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Kata sandi administrator salah.');
    }
  };

  // Change class in form auto-updates Homeroom Teacher & Whatsapp
  const handleFormClassChange = (selectedClass: string) => {
    setFormClass(selectedClass);
    if (CLASS_TEACHERS[selectedClass]) {
      setFormTeacher(CLASS_TEACHERS[selectedClass]);
    }
    if (CLASS_WHATSAPP[selectedClass]) {
      setFormWhatsapp(CLASS_WHATSAPP[selectedClass]);
    }
  };

  // Open Form for Adding New Student
  const handleOpenAddForm = () => {
    setEditingStudent(null);
    setFormNisn('');
    setFormName('');
    setFormGender('Laki-laki');
    setFormSchoolOfOrigin('');
    setFormClass('E1');
    setFormTeacher(CLASS_TEACHERS['E1']);
    setFormWhatsapp(CLASS_WHATSAPP['E1']);
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing Student
  const handleOpenEditForm = (student: Student) => {
    setEditingStudent(student);
    setFormNisn(student.nisn);
    setFormName(student.name);
    setFormGender(student.gender);
    setFormSchoolOfOrigin(student.schoolOfOrigin);
    setFormClass(student.className);
    setFormTeacher(student.homeroomTeacher);
    setFormWhatsapp(student.whatsappGroupLink);
    setFormError(null);
    setIsFormOpen(true);
  };

  // Save / Submit Student Form (Add or Edit)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nisn = formNisn.trim();
    const name = formName.trim();
    const school = formSchoolOfOrigin.trim();
    const className = formClass.trim();
    const teacher = formTeacher.trim();
    const whatsapp = formWhatsapp.trim();

    if (!nisn || !name || !school || !className || !teacher || !whatsapp) {
      setFormError('Semua kolom data wajib diisi.');
      return;
    }

    if (nisn.length < 5) {
      setFormError('NISN minimal harus terdiri dari 5 digit angka.');
      return;
    }

    // Check duplicate NISN (only when adding or changing NISN)
    if (!editingStudent || editingStudent.nisn !== nisn) {
      const isDuplicate = students.some((s) => s.nisn === nisn);
      if (isDuplicate) {
        setFormError(`Siswa dengan NISN ${nisn} sudah terdaftar di database.`);
        return;
      }
    }

    const updatedStudent: Student = {
      nisn,
      name,
      gender: formGender,
      schoolOfOrigin: school,
      className,
      homeroomTeacher: teacher,
      whatsappGroupLink: whatsapp
    };

    let newStudents: Student[];
    if (editingStudent) {
      newStudents = students.map((s) => (s.nisn === editingStudent.nisn ? updatedStudent : s));
    } else {
      newStudents = [...students, updatedStudent];
    }

    onSaveStudents(newStudents);
    setIsFormOpen(false);
  };

  // Delete Student
  const handleDeleteStudent = (nisnToDelete: string, name: string) => {
    setPendingAction({
      type: 'delete',
      payload: { nisn: nisnToDelete, name }
    });
  };

  // Download Excel Import Template
  const downloadExcelTemplate = () => {
    const templateData = [
      {
        'NISN': '0089991111',
        'Nama Lengkap': 'Mochamad Rizky Pratama',
        'Jenis Kelamin': 'Laki-laki',
        'Asal Sekolah': 'SMP Negeri 1 Ciamis',
        'Kelas Tujuan': 'E1',
        'Wali Kelas Terkait': 'Drs. Heri Sutrisno, M.Pd.',
        'Link Grup WhatsApp': 'https://chat.whatsapp.com/CiamisSMAN2ClassE1'
      },
      {
        'NISN': '0089992222',
        'Nama Lengkap': 'Aura Kasih Lestari',
        'Jenis Kelamin': 'Perempuan',
        'Asal Sekolah': 'SMP Negeri 2 Ciamis',
        'Kelas Tujuan': 'E2',
        'Wali Kelas Terkait': 'Dra. Sri Wahyuni, M.Si.',
        'Link Grup WhatsApp': 'https://chat.whatsapp.com/CiamisSMAN2ClassE2'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa Baru SMAN 2 Ciamis');
    
    // Write and download xlsx file
    XLSX.writeFile(workbook, 'Template_Impor_Siswa_SMAN2_Ciamis.xlsx');
  };

  // Handle uploading and parsing the Excel file
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) {
          setImportStatus({ success: false, message: 'Gagal memproses file Excel: data kosong.' });
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse rows to JSON
        const rawRows = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (!rawRows || rawRows.length === 0) {
          setImportStatus({ success: false, message: 'File Excel kosong atau tidak memiliki baris data.' });
          return;
        }

        // Helper to flexibly find a column value regardless of headers casing or spacing
        const getVal = (row: any, searchKeys: string[]): string => {
          const normalizedSearches = searchKeys.map(k => k.toLowerCase().replace(/[\s_\-]/g, ''));
          for (const rawKey of Object.keys(row)) {
            const normalizedRawKey = rawKey.toLowerCase().replace(/[\s_\-]/g, '');
            if (normalizedSearches.includes(normalizedRawKey)) {
              const val = row[rawKey];
              return val !== undefined && val !== null ? String(val).trim() : '';
            }
          }
          return '';
        };

        const parsedStudents: Student[] = [];
        const encounteredNisns = new Set<string>();

        for (let i = 0; i < rawRows.length; i++) {
          const row = rawRows[i];
          
          const nisn = getVal(row, ['nisn', 'noinduk', 'nomorinduk', 'id', 'student_id']);
          const name = getVal(row, ['namalengkap', 'nama', 'name', 'namasiswa', 'studentname', 'fullname']);
          
          let rawGender = getVal(row, ['jeniskelamin', 'gender', 'jk', 'sex', 'kelamin']);
          let gender: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
          if (
            rawGender.toLowerCase().startsWith('p') || 
            rawGender.toLowerCase() === 'perempuan' || 
            rawGender.toLowerCase() === 'female' || 
            rawGender.toLowerCase() === 'w' || 
            rawGender.toLowerCase() === 'wanita'
          ) {
            gender = 'Perempuan';
          }

          const schoolOfOrigin = getVal(row, ['asalsekolah', 'schooloforigin', 'sekolahasal', 'sekolah', 'smp', 'mts', 'asalsmp']);
          
          // Normalize class name target to E1 - E12 (with keywords support for rombel, rombonganbelajar)
          let rawClass = getVal(row, ['kelastujuan', 'classname', 'kelas', 'class', 'kelasterkait', 'rombel', 'rombonganbelajar']).toUpperCase().replace(/[\s\-]/g, '');
          let className = 'E1';
          const matchE = rawClass.match(/E(\d+)/i);
          if (matchE) {
            const num = parseInt(matchE[1], 10);
            if (num >= 1 && num <= 12) {
              className = `E${num}`;
            }
          } else {
            const numMatch = rawClass.match(/(\d+)/);
            if (numMatch) {
              const num = parseInt(numMatch[1], 10);
              if (num >= 1 && num <= 12) {
                className = `E${num}`;
              }
            }
          }

          const homeroomTeacher = getVal(row, ['walikelasterkait', 'homeroomteacher', 'walikelas', 'wali', 'walikelasbaru', 'teacher', 'walas']);
          const whatsappGroupLink = getVal(row, ['linkgrupwhatsapp', 'whatsappgrouplink', 'linkwa', 'whatsapp', 'grupwa', 'groupwa', 'linkwhatsapp', 'wailink']);

          if (!nisn || !name) {
            setImportStatus({ 
              success: false, 
              message: `Baris ke-${i + 2} gagal diimpor. Kolom 'NISN' dan 'Nama Lengkap' wajib terisi.` 
            });
            return;
          }

          if (encounteredNisns.has(nisn)) {
            setImportStatus({
              success: false,
              message: `NISN ganda ditemukan di baris ke-${i + 2}: ${nisn}`
            });
            return;
          }

          encounteredNisns.add(nisn);

          parsedStudents.push({
            nisn,
            name,
            gender,
            schoolOfOrigin: schoolOfOrigin || 'SMAN 2 Ciamis',
            className,
            homeroomTeacher: homeroomTeacher || CLASS_TEACHERS[className] || 'Wali Kelas Baru',
            whatsappGroupLink: whatsappGroupLink || CLASS_WHATSAPP[className] || 'https://chat.whatsapp.com/'
          });
        }

        setPendingAction({
          type: 'import',
          payload: parsedStudents
        });

      } catch (err: any) {
        setImportStatus({ success: false, message: `Gagal membaca file Excel: ${err.message}` });
      }
    };

    reader.onerror = () => {
      setImportStatus({ success: false, message: 'Gagal membaca file dari penyimpanan.' });
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Export full DB to Excel
  const exportFullDatabaseToExcel = () => {
    const dataToExport = students.map((s) => ({
      'NISN': s.nisn,
      'Nama Lengkap': s.name,
      'Jenis Kelamin': s.gender,
      'Asal Sekolah': s.schoolOfOrigin,
      'Kelas Tujuan': s.className,
      'Wali Kelas Terkait': s.homeroomTeacher,
      'Link Grup WhatsApp': s.whatsappGroupLink
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Database Siswa SMAN 2 Ciamis');
    
    XLSX.writeFile(workbook, `Siswa_SMAN2_Ciamis_Lengkap_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleResetData = () => {
    setPendingAction({
      type: 'reset',
      payload: null
    });
  };

  // Computed Stats
  const stats = useMemo(() => {
    const total = students.length;
    const boys = students.filter((s) => s.gender === 'Laki-laki').length;
    const girls = students.filter((s) => s.gender === 'Perempuan').length;
    
    const distribution: Record<string, number> = {};
    students.forEach((s) => {
      distribution[s.className] = (distribution[s.className] || 0) + 1;
    });

    return { total, boys, girls, distribution };
  }, [students]);

  // Filter & Search Logic
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchQuery = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.nisn.includes(searchQuery) ||
        student.schoolOfOrigin.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchClass = classFilter === 'Semua' || student.className === classFilter;

      return matchQuery && matchClass;
    });
  }, [students, searchQuery, classFilter]);

  if (!isAdminAuthenticated) {
    // LOGIN PORTAL ADMIN (Elegant Slate-Gray & Primary Blue with subtle gold notes, matching the student login)
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
        >
          <div className="bg-[#0f172a] px-6 py-8 text-center text-white relative">
            <button 
              onClick={onBackToPortal}
              className="absolute left-4 top-4 text-slate-300 hover:text-white transition-all bg-white/10 p-1.5 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="inline-flex items-center justify-center bg-white/10 p-3 rounded-2xl mb-3 backdrop-blur-md border border-white/10 shadow-sm">
              <Lock className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight">Portal Administrasi</h1>
            <p className="text-slate-300 text-xs mt-1">Gunakan sandi resmi panitia SMAN 2 Ciamis</p>
          </div>

          <form onSubmit={handleAuth} className="p-6 space-y-4">
            {authError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block" htmlFor="admin-pass">
                Kata Sandi Administrator
              </label>
              <input
                id="admin-pass"
                type="password"
                placeholder="Masukkan kata sandi admin"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-mono text-center"
                required
              />
            </div>

            <button
              id="btn-auth-admin"
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary-50"
            >
              <span>Buka Dasbor Admin</span>
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD (Clean, Soft Muted Slate & Indigo layout - easy on eyes)
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8" id="admin-dashboard">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a] border border-slate-800 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/10 text-slate-300 px-2.5 py-1 rounded-full border border-white/5">
              SMAN 2 CIAMIS • ADMIN
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary-400" />
            Sistem Informasi Pengolahan Kelas
          </h1>
          <p className="text-slate-300 text-xs font-medium">Kelola data pembagian kelas, nama wali kelas, dan tautan grup koordinasi WhatsApp</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 z-10">
          <button
            onClick={exportFullDatabaseToExcel}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Ekspor Excel (XLSX)</span>
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Unggah Excel</span>
          </button>

          {/* Invisible file input for parsing excel */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleExcelUpload} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />

          <button
            onClick={onBackToPortal}
            className="bg-white text-slate-900 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali Ke Portal</span>
          </button>
        </div>
      </div>

      {/* Import Status Messages */}
      {importStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs flex items-start gap-2 border ${
            importStatus.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-850' 
              : 'bg-rose-50 border-rose-200 text-rose-850'
          }`}
        >
          {importStatus.success ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="flex-grow">
            <p className="font-bold">{importStatus.success ? 'Impor Berhasil' : 'Impor Gagal'}</p>
            <p className="mt-0.5 font-medium">{importStatus.message}</p>
          </div>
          <button 
            onClick={() => setImportStatus(null)}
            className="text-slate-400 hover:text-slate-800 font-bold ml-2 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Total Calon Siswa</div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          </div>
        </div>

        {/* Gender stats */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase">Jenis Kelamin</div>
            <div className="text-xs font-bold text-slate-700 space-y-0.5">
              <div>Laki-laki: <span className="font-extrabold text-primary-600">{stats.boys}</span></div>
              <div>Perempuan: <span className="font-extrabold text-slate-500">{stats.girls}</span></div>
            </div>
          </div>
        </div>

        {/* Class distribution */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm flex items-center gap-4 col-span-1 sm:col-span-2">
          <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl">
            <Layers className="h-6 w-6" />
          </div>
          <div className="w-full">
            <div className="text-xs text-slate-400 font-bold uppercase mb-2">Penyebaran Siswa per Kelas</div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-center">
              {Array.from({ length: 12 }, (_, i) => `E${i + 1}`).map((cls) => (
                <div key={cls} className="bg-slate-50 rounded-xl py-1 px-1 border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-500 block">{cls}</span>
                  <span className="text-xs font-black text-slate-800">{stats.distribution[cls] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Controls Bar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:max-w-xl">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Cari berdasarkan Nama, NISN atau Asal Sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Kelas:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-slate-700"
              >
                <option value="Semua">Semua Kelas</option>
                {Array.from({ length: 12 }, (_, i) => `E${i + 1}`).map((cls) => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={downloadExcelTemplate}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer animate-none"
              title="Unduh template Excel untuk impor massal"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
              <span>Unduh Template Excel</span>
            </button>

            <button
              onClick={handleResetData}
              className="bg-slate-50/50 hover:bg-slate-100 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl border border-slate-250 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Muat ulang seluruh data bawaan SMAN 2 Ciamis"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset Demo</span>
            </button>

            <button
              onClick={handleOpenAddForm}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-primary-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Siswa</span>
            </button>
          </div>

        </div>

        {/* Database Table */}
        <div className="overflow-x-auto">
          {filteredStudents.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-6">NISN</th>
                  <th className="py-3.5 px-6">Nama Lengkap</th>
                  <th className="py-3.5 px-6">Jenis Kelamin</th>
                  <th className="py-3.5 px-6">Asal Sekolah</th>
                  <th className="py-3.5 px-6">Kelas</th>
                  <th className="py-3.5 px-6">Wali Kelas</th>
                  <th className="py-3.5 px-6">Link WhatsApp Grup</th>
                  <th className="py-3.5 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {filteredStudents.map((student) => (
                  <tr key={student.nisn} className="hover:bg-slate-50/40 transition-all">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-650">{student.nisn}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">{student.name}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {student.gender}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">{student.schoolOfOrigin}</td>
                    <td className="py-3.5 px-6 font-extrabold text-primary-600">{student.className}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-700">{student.homeroomTeacher}</td>
                    <td className="py-3.5 px-6 font-medium text-primary-600 truncate max-w-[120px]">
                      <a 
                        href={student.whatsappGroupLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="hover:underline hover:text-primary-700 text-[10px] font-mono"
                      >
                        {student.whatsappGroupLink}
                      </a>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditForm(student)}
                          className="p-1.5 text-slate-400 hover:text-indigo-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.nisn, student.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2 bg-slate-50/10">
              <Layers className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">Tidak ada data siswa yang cocok dengan filter / pencarian.</p>
              <p className="text-[11px] text-slate-400">Silakan ubah kata kunci atau tambahkan siswa baru.</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
          <span>Menampilkan {filteredStudents.length} dari total {students.length} data siswa</span>
          <span>SMAN 2 CIAMIS - Sistem Pembagian Kelas</span>
        </div>
      </div>

      {/* FORM MODAL (Add / Edit Student) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  {editingStudent ? <Edit2 className="h-4 w-4 text-slate-300" /> : <Plus className="h-4 w-4 text-white" />}
                  {editingStudent ? 'Edit Data Penempatan' : 'Tambah Siswa Baru'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="p-6 space-y-4 text-slate-800">
                {formError && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full shrink-0"></span>
                    <span>{formError}</span>
                  </div>
                )}                 {/* NISN Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="form-nisn">
                    NISN Siswa
                  </label>
                  <input
                    id="form-nisn"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Contoh: 0081234561"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white font-mono"
                    required
                  />
                  <span className="text-[9px] text-slate-450 block pt-0.5 font-medium">
                    *Nomor ini juga digunakan sebagai password login awal siswa.
                  </span>
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="form-name">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    id="form-name"
                    type="text"
                    placeholder="Contoh: Mochamad Rizky Pratama"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                    required
                  />
                </div>

                {/* Gender Toggle */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Jenis Kelamin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormGender('Laki-laki')}
                      className={`py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                        formGender === 'Laki-laki'
                          ? 'bg-[#0f172a] border-[#0f172a] text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Laki-laki (L)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormGender('Perempuan')}
                      className={`py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${
                        formGender === 'Perempuan'
                          ? 'bg-[#0f172a] border-[#0f172a] text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Perempuan (P)
                    </button>
                  </div>
                </div>

                {/* Asal Sekolah */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="form-school">
                    Asal Sekolah (SMP/MTs)
                  </label>
                  <input
                    id="form-school"
                    type="text"
                    placeholder="Contoh: SMP Negeri 1 Ciamis"
                    value={formSchoolOfOrigin}
                    onChange={(e) => setFormSchoolOfOrigin(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                    required
                  />
                </div>

                {/* Class Assignment */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block" htmlFor="form-class-select">
                      Kelas Tujuan
                    </label>
                    <select
                      id="form-class-select"
                      value={formClass}
                      onChange={(e) => handleFormClassChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 font-bold"
                    >
                      {Array.from({ length: 12 }, (_, i) => `E${i + 1}`).map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block" htmlFor="form-teacher-input">
                      Wali Kelas
                    </label>
                    <input
                      id="form-teacher-input"
                      type="text"
                      placeholder="Nama Wali Kelas"
                      value={formTeacher}
                      onChange={(e) => setFormTeacher(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp Group Link */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block" htmlFor="form-whatsapp">
                    Tautan Grup WhatsApp Kelas
                  </label>
                  <input
                    id="form-whatsapp"
                    type="url"
                    placeholder="https://chat.whatsapp.com/..."
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white font-mono"
                    required
                  />
                  <span className="text-[9px] text-slate-400 block pt-0.5 font-medium">
                    *Link grup WhatsApp ini akan dimasukkan ke PDF siswa dan dikonversi ke QR Code.
                  </span>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1 shadow-primary-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Simpan Siswa</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRMATION MODAL FOR IFRAME COMPATIBILITY */}
      <AnimatePresence>
        {pendingAction && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 space-y-4 text-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${
                    pendingAction.type === 'delete' 
                      ? 'bg-rose-50 text-rose-600' 
                      : pendingAction.type === 'reset'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-primary-50 text-primary-600'
                  }`}>
                    {pendingAction.type === 'delete' ? (
                      <Trash2 className="h-5 w-5" />
                    ) : pendingAction.type === 'reset' ? (
                      <RotateCcw className="h-5 w-5" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {pendingAction.type === 'delete' && 'Hapus Data Siswa'}
                    {pendingAction.type === 'reset' && 'Reset Database'}
                    {pendingAction.type === 'import' && 'Impor Data Excel'}
                  </h3>
                </div>
                
                <p className="text-xs text-slate-650 leading-relaxed font-medium">
                  {pendingAction.type === 'delete' && (
                    `Apakah Anda yakin ingin menghapus siswa "${pendingAction.payload.name}" (NISN: ${pendingAction.payload.nisn})? Tindakan ini tidak dapat dibatalkan.`
                  )}
                  {pendingAction.type === 'reset' && (
                    'Apakah Anda yakin ingin mengatur ulang database ke data demo bawaan SMAN 2 Ciamis? Semua data baru Anda akan hilang.'
                  )}
                  {pendingAction.type === 'import' && (
                    `Ditemukan ${pendingAction.payload.length} siswa dalam file Excel. Lanjutkan untuk menggabungkannya ke dalam database SMAN 2 Ciamis?`
                  )}
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPendingAction(null)}
                    className="flex-1 py-2 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executePendingAction}
                    className={`flex-1 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-sm cursor-pointer ${
                      pendingAction.type === 'delete'
                        ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                        : pendingAction.type === 'reset'
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                        : 'bg-primary-600 hover:bg-primary-700 shadow-primary-50'
                    }`}
                  >
                    {pendingAction.type === 'delete' && 'Hapus'}
                    {pendingAction.type === 'reset' && 'Reset'}
                    {pendingAction.type === 'import' && 'Impor'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
