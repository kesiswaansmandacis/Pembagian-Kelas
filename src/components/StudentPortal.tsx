import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  User, 
  Lock, 
  LogOut, 
  School, 
  Sparkles, 
  Download, 
  Eye, 
  EyeOff,
  AlertCircle,
  MessageCircle,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { Student } from '../types';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface StudentPortalProps {
  students: Student[];
}

// Map beautiful, elegant, muted themes for each class to keep the UI interesting but sophisticated (not dizzying)
export const getThemeForClass = (className: string) => {
  const normalized = className.trim().toUpperCase();
  const index = parseInt(normalized.replace(/\D/g, '')) || 1;

  switch (index % 6) {
    case 1: // Primary Blue
      return {
        bg: 'bg-primary-50/50 border-primary-100',
        badge: 'bg-primary-100 text-primary-800 border-primary-200',
        text: 'text-primary-950',
        accentText: 'text-primary-600 font-extrabold',
        accentBg: 'bg-primary-600 hover:bg-primary-700 text-white',
        accentBorder: 'border-primary-200',
        gradient: 'from-primary-700 via-primary-800 to-primary-900',
        indicator: 'bg-primary-500',
        subtleBg: 'bg-primary-50/30'
      };
    case 2: // Slate Gray
      return {
        bg: 'bg-slate-50/50 border-slate-200',
        badge: 'bg-slate-100 text-slate-800 border-slate-200',
        text: 'text-slate-900',
        accentText: 'text-slate-800 font-extrabold',
        accentBg: 'bg-slate-800 hover:bg-slate-900 text-white',
        accentBorder: 'border-slate-300',
        gradient: 'from-slate-800 via-slate-950 to-slate-900',
        indicator: 'bg-slate-500',
        subtleBg: 'bg-slate-50/30'
      };
    case 3: // Emerald Green
      return {
        bg: 'bg-emerald-50/40 border-emerald-100',
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        text: 'text-emerald-950',
        accentText: 'text-emerald-650 font-extrabold',
        accentBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        accentBorder: 'border-emerald-200',
        gradient: 'from-emerald-700 via-emerald-800 to-emerald-900',
        indicator: 'bg-emerald-500',
        subtleBg: 'bg-emerald-50/30'
      };
    case 4: // Indigo
      return {
        bg: 'bg-indigo-50/40 border-indigo-100',
        badge: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        text: 'text-indigo-950',
        accentText: 'text-indigo-600 font-extrabold',
        accentBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        accentBorder: 'border-indigo-200',
        gradient: 'from-indigo-700 via-slate-900 to-indigo-900',
        indicator: 'bg-indigo-500',
        subtleBg: 'bg-indigo-50/30'
      };
    case 5: // Sky Blue
      return {
        bg: 'bg-sky-50/40 border-sky-100',
        badge: 'bg-sky-100 text-sky-900 border-sky-200',
        text: 'text-sky-950',
        accentText: 'text-sky-650 font-extrabold',
        accentBg: 'bg-sky-600 hover:bg-sky-700 text-white',
        accentBorder: 'border-sky-200',
        gradient: 'from-sky-700 via-sky-800 to-sky-900',
        indicator: 'bg-sky-500',
        subtleBg: 'bg-sky-50/30'
      };
    case 0: // Violet
    default:
      return {
        bg: 'bg-violet-50/40 border-violet-100',
        badge: 'bg-violet-100 text-violet-900 border-violet-200',
        text: 'text-violet-950',
        accentText: 'text-violet-650 font-extrabold',
        accentBg: 'bg-violet-600 hover:bg-violet-700 text-white',
        accentBorder: 'border-violet-200',
        gradient: 'from-violet-700 via-violet-800 to-violet-900',
        indicator: 'bg-violet-500',
        subtleBg: 'bg-violet-50/30'
      };
  }
};

// Utility to generate a high-quality stylized QR Code using the qrcode package
async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 240,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR Code generation failed:', err);
    return '';
  }
}

// Utility to generate a classic linear barcode for student ID completely offline
function generateBarcodeDataURL(text: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 70;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 300, 70);

  ctx.fillStyle = '#1e3a8a'; // Blue barcode
  const safeText = text || '';
  let x = 25;
  let seed = 98765;
  for (let i = 0; i < safeText.length; i++) {
    seed += safeText.charCodeAt(i);
  }
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (x < 275) {
    const width = random() > 0.5 ? 2 : 4;
    ctx.fillRect(x, 10, width, 40);
    x += width + (random() > 0.4 ? 2 : 3);
  }

  ctx.font = '10px monospace';
  ctx.fillStyle = '#1e3a8a';
  ctx.textAlign = 'center';
  ctx.fillText(`*${safeText}*`, 150, 62);

  // Use JPEG as it is highly supported on all browsers and jsPDF versions
  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function StudentPortal({ students }: StudentPortalProps) {
  const [nisnInput, setNisnInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State for tracking PDF download process and alternative download link
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisnInput.trim() || !passwordInput.trim()) {
      setError('Harap isi NISN dan Password.');
      return;
    }

    setLoading(true);
    setError(null);

    // Simulated verification delay
    setTimeout(() => {
      const student = students.find(
        (s) => s.nisn === nisnInput.trim() && s.nisn === passwordInput.trim()
      );

      if (student) {
        setLoggedInStudent(student);
        setError(null);
        setPdfBlobUrl(null);
        setPdfError(null);
      } else {
        setError('NISN atau Password salah. (Gunakan NISN Anda sebagai password)');
      }
      setLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    setLoggedInStudent(null);
    setNisnInput('');
    setPasswordInput('');
    setError(null);
    setPdfBlobUrl(null);
    setPdfError(null);
  };

  // Generate PDF when user clicks to prevent popup/download block in sandboxed iframes
  const generatePDF = async () => {
    if (!loggedInStudent) return;
    setIsDownloading(true);
    setPdfError(null);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. Theme Borders and Elements (Strictly Blue & Gold)
      doc.setDrawColor(30, 58, 138); // Dark Blue
      doc.setLineWidth(0.8);
      doc.rect(6, 6, 198, 285); // Outer frame

      doc.setLineWidth(0.2);
      doc.rect(8, 8, 194, 281); // Inner frame

      // 2. School Header
      doc.setFillColor(30, 58, 138);
      doc.rect(10, 10, 190, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138);
      doc.text('SMAN 2 CIAMIS', 105, 23, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Jl. K.H. Ahmad Dahlan No.2 Ciamis, Jawa Barat', 105, 30, { align: 'center' });

      // Decorative separator line
      doc.setDrawColor(219, 234, 254);
      doc.setLineWidth(0.5);
      doc.line(15, 38, 195, 38);

      // Subtitle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 58, 138);
      doc.text('BUKTI RESMI PENEMPATAN KELAS BARU', 105, 46, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Tahun Pelajaran 2026/2027', 105, 51, { align: 'center' });

      // 3. Student Profile Card Border
      doc.setFillColor(248, 250, 252); // Light Slate/White
      doc.rect(15, 58, 180, 52, 'F');
      doc.setDrawColor(219, 234, 254);
      doc.setLineWidth(0.3);
      doc.rect(15, 58, 180, 52);

      // Header inside Profile Card
      doc.setFillColor(30, 58, 138);
      doc.rect(15, 58, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('DATA DIRI CALON SISWA', 20, 63);

      // Student Details Grid
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      // Left labels
      doc.setFont('helvetica', 'bold');
      doc.text('NISN', 20, 74);
      doc.text('Nama Lengkap', 20, 81);
      doc.text('Jenis Kelamin', 20, 88);
      doc.text('Asal Sekolah', 20, 95);
      doc.text('Tanggal Unduh', 20, 102);

      // Safe local fallbacks for student properties to prevent any undefined crashes
      const studentNisn = loggedInStudent.nisn || '';
      const studentName = loggedInStudent.name || 'Siswa';
      const studentGender = loggedInStudent.gender || 'Laki-laki';
      const studentSchool = loggedInStudent.schoolOfOrigin || 'SMAN 2 Ciamis';
      const studentClass = loggedInStudent.className || 'E1';
      const studentTeacher = loggedInStudent.homeroomTeacher || 'Wali Kelas Baru';
      const studentWhatsapp = loggedInStudent.whatsappGroupLink || 'https://chat.whatsapp.com/';

      // Colons and values
      doc.setFont('helvetica', 'normal');
      doc.text(`:   ${studentNisn}`, 55, 74);
      doc.text(`:   ${studentName}`, 55, 81);
      doc.text(`:   ${studentGender}`, 55, 88);
      doc.text(`:   ${studentSchool}`, 55, 95);
      
      const now = new Date();
      const formattedDate = now.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`:   ${formattedDate} WIB`, 55, 102);

      // 4. Placement Announcement Box
      doc.setFillColor(239, 246, 255); // Solid Very Light Blue
      doc.rect(15, 118, 180, 40, 'F');
      doc.setDrawColor(191, 219, 254);
      doc.setLineWidth(0.5);
      doc.rect(15, 118, 180, 40);

      // Announcement text header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text('SURAT KEPUTUSAN PENEMPATAN KELAS', 105, 126, { align: 'center' });

      // Announcement paragraph wrapped nicely
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      
      const paragraph = `Selamat "${studentName}" kamu telah menyelesaikan kegiatan MPLS Pancawaluya SMAN 2 Ciamis, untuk selanjutnya kamu akan ditempatkan di:`;
      const lines = doc.splitTextToSize(paragraph, 170);
      doc.text(lines, 20, 133);

      // Class and homeroom text emphasized
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Kelas: "${studentClass}"`, 20, 148);
      doc.text(`Wali Kelas: "${studentTeacher}"`, 20, 153);

      // 5. WhatsApp Integration and QR Code
      doc.setFillColor(255, 255, 255);
      doc.rect(15, 166, 180, 72, 'F');
      doc.setDrawColor(219, 234, 254);
      doc.setLineWidth(0.3);
      doc.rect(15, 166, 180, 72);

      // Mini Title
      doc.setFillColor(30, 58, 138);
      doc.rect(15, 166, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('INTEGRASI GRUP WHATSAPP KELAS', 20, 171);

      // Left instruction text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text('Silakan bergabung ke dalam grup WhatsApp resmi', 20, 183);
      doc.text('bersama Wali Kelas dan teman kelas baru Anda.', 20, 188);

      doc.setFont('helvetica', 'bold');
      doc.text('Tautan Grup WhatsApp Kelas:', 20, 198);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 58, 138);
      
      // Link wrap
      const linkLines = doc.splitTextToSize(studentWhatsapp, 110);
      doc.text(linkLines, 20, 204);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('*Scan/Klik QR Code di sebelah kanan untuk bergabung secara otomatis', 20, 218);
      doc.text(' menggunakan aplikasi kamera ponsel Anda.', 20, 222);

      // Insert generated QR Code (Uses safe JPEG format)
      const qrCodeData = await generateQRCodeDataURL(studentWhatsapp);
      if (qrCodeData) {
        doc.addImage(qrCodeData, 'JPEG', 142, 178, 48, 48);
        // Make the QR Code image clickable in the PDF
        doc.link(142, 178, 48, 48, { url: studentWhatsapp });
      }

      // Make the text link clickable inside the PDF
      doc.link(20, 202, 110, 10, { url: studentWhatsapp });

      // 6. Signature / Bottom section
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Ciamis, Juli 2026', 135, 250);
      doc.setFont('helvetica', 'bold');
      doc.text('Panitia MPLS Pancawaluya', 135, 255);
      doc.text('SMAN 2 Ciamis', 135, 260);

      // 7. Insert bottom decorative barcode for authenticity (Uses safe JPEG format)
      const barcodeData = generateBarcodeDataURL(studentNisn);
      if (barcodeData) {
        doc.addImage(barcodeData, 'JPEG', 15, 248, 80, 22);
      }

      // Save PDF file instantly (this will trigger standard download)
      doc.save(`Bukti_Penempatan_SMAN_2_Ciamis_${studentName.replace(/\s+/g, '_')}.pdf`);

      // ALSO generate a reusable blob URL that does not expire and store in React state.
      // This is the ultimate fallback! If Chrome/Safari inside the AI Studio iframe block doc.save,
      // the user can simply tap the beautiful green "Cetak/Buka Langsung" link that we render in the UI.
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setPdfError(err?.message || 'Gagal memproses file PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const classTheme = loggedInStudent ? getThemeForClass(loggedInStudent.className) : null;

  return (
    <div id="student-portal-root" className="w-full max-w-md mx-auto px-4 py-6 md:py-12">
      <AnimatePresence mode="wait">
        {!loggedInStudent ? (
          // LOGIN SCREEN (Strictly Elegant Slate-Gray & Indigo with subtle gold notes)
          <motion.div
            key="login-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
          >
            {/* Top Banner Accent */}
            <div className="bg-[#1766d1] px-6 py-8 text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-60"></div>
              
              <div className="inline-flex items-center justify-center bg-white/10 p-3 rounded-2xl mb-3 backdrop-blur-md border border-white/10 shadow-sm">
                <GraduationCap className="h-8 w-8 text-amber-400" />
              </div>
              
              <h1 className="text-xl font-extrabold tracking-tight">SMAN 2 CIAMIS</h1>
              <p className="text-slate-300 text-xs mt-1">Sistem Informasi Pembagian Kelas</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="p-6 space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-base font-bold text-slate-900">Masuk Portal Siswa</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan nomor NISN Anda sebagai username dan password.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* NISN Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="nisn-input">
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="nisn-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Masukkan NISN Anda"
                    value={nisnInput}
                    onChange={(e) => setNisnInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-mono"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block" htmlFor="password-input">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan Password Anda"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-mono"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block pt-0.5 font-medium">
                  *Kata sandi secara standar sama dengan nomor NISN Anda.
                </span>
              </div>

              {/* Submit Button */}
              <button
                id="btn-login-siswa"
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-primary-50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk & Cek Kelas</span>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          // PLACEMENT INFORMATION SCREEN (Dynamically adopts class custom soft theme!)
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="space-y-4 text-slate-800"
          >
            {/* Top Celebration Header (Dynamic Gradient) */}
            <div className={`bg-gradient-to-br ${classTheme?.gradient} rounded-3xl p-6 text-white text-center shadow-lg relative overflow-hidden`}>
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-xl"></div>
              
              <div className="inline-flex items-center justify-center bg-white/20 p-2.5 rounded-2xl mb-3 backdrop-blur-md">
                <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
              </div>

              <h2 className="text-base font-extrabold tracking-tight uppercase">Hasil Penempatan Kelas SMAN 2 Ciamis</h2>
            </div>

            {/* Primary Announcement Box */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
              {/* Student Details Grid */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Data Diri Siswa
                </h3>
                
                <div className={`bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3`}>
                  <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">NISN</span>
                    <span className="font-mono font-bold text-slate-900">{loggedInStudent.nisn}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">Nama Lengkap</span>
                    <span className="font-bold text-slate-900 text-right">{loggedInStudent.name}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
                    <span className="text-slate-500 font-semibold">Jenis Kelamin</span>
                    <span className="font-bold text-slate-900">{loggedInStudent.gender}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <School className="h-3 w-3 text-slate-400" />
                      Asal Sekolah
                    </span>
                    <span className="font-bold text-slate-900 text-right">{loggedInStudent.schoolOfOrigin}</span>
                  </div>
                </div>
              </div>

              {/* Class Placement Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center">
                  <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Kelas</div>
                  <div className={`text-2xl font-black ${classTheme?.accentText}`}>{loggedInStudent.className}</div>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-center flex flex-col justify-center">
                  <div className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">Wali Kelas</div>
                  <div className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-tight">{loggedInStudent.homeroomTeacher}</div>
                </div>
              </div>

              {/* Dynamic WhatsApp Group Invitation Link */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-900">Grup WhatsApp Wali Kelas & Kelas Baru</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Silakan bergabung ke grup WhatsApp berikut untuk berkoordinasi dan menerima informasi terbaru mengenai pembelajaran Anda:
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={loggedInStudent.whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-50"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Gabung Grup Kelas ({loggedInStudent.className})</span>
                  </a>
                  
                  {/* Miniature barcode display */}
                  <div className="p-1.5 bg-white rounded-xl border border-slate-200 flex items-center justify-center" title="Barcode WhatsApp">
                    <QrCode className="h-6 w-6 text-slate-700" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                
                {/* Main Download Button */}
                <button
                  id="btn-download-bukti"
                  onClick={generatePDF}
                  disabled={isDownloading}
                  className={`w-full ${classTheme?.accentBg} py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80 shadow-sm`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isDownloading ? 'Menyiapkan PDF...' : 'Unduh Bukti Penempatan (PDF Resmi)'}</span>
                </button>

                {/* Ultimate Fallback / Alternative Direct Download option - renders once PDF is compiled */}
                {pdfBlobUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-2xl text-xs space-y-2 text-emerald-900"
                  >
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                      <span>Bukti Siap Diunduh!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Jika unduhan otomatis diblokir oleh browser di dalam iframe, silakan klik tombol di bawah untuk membuka dan mencetak langsung di tab baru:
                    </p>
                    <a
                      href={pdfBlobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-sm text-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Cetak & Buka PDF Langsung</span>
                    </a>
                  </motion.div>
                )}

                {pdfError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-900 p-3.5 rounded-2xl text-xs">
                    <p className="font-bold text-rose-950">Gagal memproses PDF:</p>
                    <p className="text-[11px] text-rose-700/80 mt-1">{pdfError}</p>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  id="btn-logout"
                  onClick={handleLogout}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-slate-500" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>

            {/* Info footer */}
            <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed">
              Sistem ini memvalidasi data penempatan secara otomatis.<br />
              SMAN 2 CIAMIS • Jl. K.H. Ahmad Dahlan No.2 Ciamis.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
