/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  CheckCircle2, 
  User, 
  LogIn, 
  LogOut, 
  Loader2, 
  RefreshCw,
  ChevronRight,
  MapPin,
  FileText,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

type Status = 'Masuk' | 'Pulang' | 'Izin';

interface AttendanceData {
  name: string;
  status: Status;
  image: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  notes?: string;
}

const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

export default function App() {
  const [step, setStep] = useState<'form' | 'camera' | 'submitting' | 'success'>('form');
  const [formData, setFormData] = useState<AttendanceData>({
    name: '',
    status: 'Masuk',
    image: null,
    location: null,
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  const getLocation = (): Promise<{ latitude: number, longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        alert('Browser Anda tidak mendukung fitur lokasi.');
        resolve(null);
        return;
      }

      // Beri waktu 15 detik untuk mencari satelit agar lebih maksimal
      const options = {
        enableHighAccuracy: true,
        timeout: 15000, 
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mengambil nilai akurasi (radius error) dalam satuan meter
          const akurasi = position.coords.accuracy; 
          
          console.log(`Radius Akurasi saat ini: ${akurasi} meter`);

          // VALIDASI: Jika akurasi lebih dari 50 meter, tolak absen!
          if (akurasi > 50) {
            alert(`Sinyal GPS lemah (Radius: ${Math.round(akurasi)} meter). \n\nMohon nyalakan GPS, matikan Wi-Fi sejenak, dan berpindahlah ke luar ruangan/dekat jendela agar jarak akurasi di bawah 50 meter.`);
            resolve(null); // Batalkan proses pengambilan lokasi
            return;
          }

          // Jika akurasi bagus (di bawah 50m), lanjutkan
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error mendapatkan lokasi:', error);
          alert('Gagal mendapatkan lokasi. Pastikan izin lokasi (GPS) di HP sudah menyala.');
          resolve(null);
        },
        options
      );
    });
  };

  const handleNextStep = async () => {
    if (!formData.name) return;
    
    setIsLocating(true);
    setError(null);
    
    const location = await getLocation();
    setFormData(prev => ({ ...prev, location }));
    setIsLocating(false);

    setStep('camera');
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFormData(prev => ({ ...prev, image: imageSrc }));
      setStep('submitting');
      submitAttendance({ ...formData, image: imageSrc });
    }
  }, [webcamRef, formData]);

  const submitAttendance = async (data: AttendanceData) => {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL') {
      setError('Google Script URL is not configured. Please add VITE_GOOGLE_SCRIPT_URL to your secrets.');
      setStep('form');
      return;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requires no-cors for simple POST
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Since we use no-cors, we can't read the response body, 
      // but if it doesn't throw, we assume success for this simple implementation.
      setStep('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#64748b', '#475569', '#94a3b8']
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError('Gagal mengirim data. Silakan coba lagi.');
      setStep('form');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', status: 'Masuk', image: null, location: null, notes: '' });
    setStep('form');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="text-center mb-8">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-display font-bold tracking-widest text-brand-600 uppercase mb-1"
          >
            SD Inklusi Universal Temanggung
          </motion.h2>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-display font-bold tracking-tight text-brand-950 mb-2"
          >
            Presensi Digital
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-brand-500 font-medium"
          >
            {new Date().toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </motion.p>
        </header>

        <main className="bg-white rounded-3xl shadow-xl shadow-brand-200/50 overflow-hidden border border-brand-100">
          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8"
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-brand-700 mb-2 ml-1">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Masukkan nama Anda"
                        className="w-full pl-12 pr-4 py-4 bg-brand-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all outline-none text-brand-800 placeholder:text-brand-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-brand-700 mb-3 ml-1">
                      Status Kehadiran
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setFormData({ ...formData, status: 'Masuk' })}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all font-medium ${
                          formData.status === 'Masuk'
                            ? 'bg-brand-800 border-brand-800 text-white shadow-lg shadow-brand-800/20'
                            : 'bg-white border-brand-100 text-brand-500 hover:border-brand-200'
                        }`}
                      >
                        <LogIn className="w-5 h-5" />
                        <span className="text-xs">Masuk</span>
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, status: 'Pulang' })}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all font-medium ${
                          formData.status === 'Pulang'
                            ? 'bg-brand-800 border-brand-800 text-white shadow-lg shadow-brand-800/20'
                            : 'bg-white border-brand-100 text-brand-500 hover:border-brand-200'
                        }`}
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-xs">Pulang</span>
                      </button>
                      <button
                        onClick={() => setFormData({ ...formData, status: 'Izin' })}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all font-medium ${
                          formData.status === 'Izin'
                            ? 'bg-brand-800 border-brand-800 text-white shadow-lg shadow-brand-800/20'
                            : 'bg-white border-brand-100 text-brand-500 hover:border-brand-200'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                        <span className="text-xs">Izin</span>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {formData.status === 'Izin' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-sm font-semibold text-brand-700 mb-2 ml-1">
                          Keterangan Izin
                        </label>
                        <div className="relative">
                          <AlertCircle className="absolute left-4 top-4 w-5 h-5 text-brand-400" />
                          <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Alasan izin (sakit, keperluan keluarga, dll)"
                            className="w-full pl-12 pr-4 py-4 bg-brand-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition-all outline-none text-brand-800 placeholder:text-brand-300 min-h-[100px] resize-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-sm font-medium text-center"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    disabled={!formData.name || isLocating || (formData.status === 'Izin' && !formData.notes)}
                    onClick={handleNextStep}
                    className="w-full bg-brand-950 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-950/20 group"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Mendapatkan Lokasi...
                      </>
                    ) : (
                      <>
                        {formData.status === 'Izin' ? 'Kirim Presensi' : 'Lanjutkan ke Kamera'}
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'camera' && (
              <motion.div
                key="camera"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="relative"
              >
                <div className="aspect-[3/4] bg-brand-950 relative overflow-hidden">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                      facingMode: 'user',
                      width: 720,
                      height: 960
                    }}
                    mirrored={true}
                    imageSmoothing={true}
                    forceScreenshotSourceSize={false}
                    disablePictureInPicture={true}
                    onUserMedia={() => {}}
                    onUserMediaError={() => {}}
                    screenshotQuality={0.92}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border-[20px] border-white/10 pointer-events-none" />
                  
                  {/* Camera Overlay */}
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 px-8">
                    <button
                      onClick={() => setStep('form')}
                      className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
                    >
                      <RefreshCw className="w-6 h-6" />
                    </button>
                    <button
                      onClick={capture}
                      className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                      <div className="w-16 h-16 rounded-full border-4 border-brand-950/10 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-brand-950" />
                      </div>
                    </button>
                    <div className="w-14 h-14" /> {/* Spacer */}
                  </div>
                </div>
                <div className="p-6 text-center">
                  <p className="text-brand-500 font-medium">Posisikan wajah Anda di tengah layar</p>
                </div>
              </motion.div>
            )}

            {step === 'submitting' && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-brand-100 border-t-brand-800 animate-spin" />
                    <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-brand-800 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-brand-950 mb-2">Mengirim Data...</h3>
                    <p className="text-brand-500">Mohon tunggu sebentar, sedang memproses presensi Anda.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-14 h-14 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-brand-950 mb-2">Berhasil!</h3>
                    <p className="text-brand-500 leading-relaxed">
                      Terima kasih, <span className="font-bold text-brand-800">{formData.name}</span>.<br />
                      Presensi <span className="font-bold text-brand-800">{formData.status}</span> Anda telah tercatat.
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="mt-4 px-8 py-3 bg-brand-100 text-brand-800 rounded-xl font-semibold hover:bg-brand-200 transition-all"
                  >
                    Selesai
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Info */}
        <footer className="mt-8 text-center">
          <p className="text-brand-400 text-xs font-medium">
            &copy; {new Date().getFullYear()} SD Inklusi Universal Temanggung
          </p>
        </footer>
      </div>
    </div>
  );
}
