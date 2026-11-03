import React from 'react';
import { Award, Building2, CheckCircle2, Code2, Sparkles, Target, X } from 'lucide-react';
import { IniyanditLogo } from '../brand/IniyanditLogo';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
  portalName: string;
  institutionName: string;
  tagline: string;
}

export function AboutModal({
  open,
  onClose,
  portalName,
  institutionName,
  tagline,
}: AboutModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Header Banner */}
        <div className="relative bg-linear-to-r from-[#064E3B] via-[#0F766E] to-[#0D9488] text-white p-6 sm:p-7 overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup informasi aplikasi"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-2 rounded-2xl bg-white shadow-lg w-fit">
              <IniyanditLogo variant="icon" size={54} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-teal-100 text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-[#A3E635]" />
                Tentang Aplikasi
              </span>
              <h2 id="about-modal-title" className="text-xl sm:text-2xl font-extrabold mt-1">
                {portalName || 'Iniyandit Application Center'}
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 font-medium">
                {institutionName || 'UPTD Puskesmas Iniyandit'}
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-7 space-y-5 text-left">
          {/* Deskripsi */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0F766E] mb-1.5">
              Deskripsi Aplikasi
            </h3>
            <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
              Portal digital satu pintu yang dirancang untuk mempermudah akses petugas UPTD
              Puskesmas Iniyandit terhadap berbagai aplikasi dan website pelayanan kesehatan.
            </p>
          </div>

          {/* Grid Info: Institusi & Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E] mb-1">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Institusi</span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-[#0F172A]">
                {institutionName || 'UPTD Puskesmas Iniyandit'}
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 italic">{tagline}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E] mb-1">
                <Target className="w-4 h-4 shrink-0" />
                <span>Tujuan Portal</span>
              </div>
              <p className="text-xs text-[#0F172A] leading-relaxed font-medium">
                Mendukung digitalisasi, efisiensi, dan kemudahan akses aplikasi dalam lingkungan
                kerja Puskesmas.
              </p>
            </div>
          </div>

          {/* Official Developer & Designer Attribution Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-r from-[#F0FDFA] via-teal-50/70 to-[#ECFDF5] border border-[#14B8A6]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                  <Award className="w-3.5 h-3.5" />
                  <span>Perancang dan Pengembang Aplikasi</span>
                </div>
                <p className="text-sm sm:text-base font-extrabold text-[#0F172A] mt-0.5">
                  Sulfikri Hidayat, S.Tr.Kes.
                </p>
                <p className="text-xs text-[#475569] mt-0.5">
                  Dirancang dan Dikembangkan oleh Sulfikri Hidayat, S.Tr.Kes.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-teal-200 text-[11px] font-bold text-[#0F766E] self-start sm:self-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Original Build</span>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-[11px] text-[#64748B]">
              © {new Date().getFullYear()} Iniyandit Application Center
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
