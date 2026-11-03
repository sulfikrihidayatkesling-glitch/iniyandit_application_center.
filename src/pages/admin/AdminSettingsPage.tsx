import React, { useEffect, useRef, useState } from 'react';
import { Award, CheckCircle2, Code2, Download, Loader2, Palette, Save, Upload } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { useToast } from '../../components/common/ToastContext';
import {
  IniyanditIconSvg,
  IniyanditLogo,
  getIniyanditLogoSvgString,
} from '../../components/brand/IniyanditLogo';
import { PortalSettings } from '../../types';
import { savePortalSettings } from '../../services/portalService';
import { uploadLogoImage } from '../../services/storageService';

export function AdminSettingsPage() {
  const { settings, hasCustomSettingsDoc } = usePortal();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<PortalSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [uploadingCustomLogo, setUploadingCustomLogo] = useState(false);
  const [uploadingOfficialLogo, setUploadingOfficialLogo] = useState(false);

  const customLogoInputRef = useRef<HTMLInputElement | null>(null);
  const officialLogoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleUploadPortalLogo = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'logoUrl' | 'officialLogoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (targetField === 'logoUrl') setUploadingCustomLogo(true);
    else setUploadingOfficialLogo(true);

    try {
      const result = await uploadLogoImage(file, 'portal');
      setFormData((prev) => ({ ...prev, [targetField]: result.url }));
      showToast({
        type: 'success',
        title: 'Logo Berhasil Diproses',
        description: 'Klik "Simpan Pengaturan" untuk menerapkan perubahan pada seluruh portal.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Mengunggah Logo',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      if (targetField === 'logoUrl') setUploadingCustomLogo(false);
      else setUploadingOfficialLogo(false);
      if (customLogoInputRef.current) customLogoInputRef.current.value = '';
      if (officialLogoInputRef.current) officialLogoInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePortalSettings(formData, !hasCustomSettingsDoc);
      showToast({
        type: 'success',
        title: 'Pengaturan Disimpan',
        description: 'Identitas dan konfigurasi portal berhasil diperbarui.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Pengaturan',
        description: err instanceof Error ? err.message : 'Terjadi kesalahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadOriginalLogoSvg = () => {
    const svgContent = getIniyanditLogoSvgString();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Logo-Iniyandit-Application-Center.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A]">
            Pengaturan Portal &amp; Identitas Brand
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Konfigurasi informasi portal, integrasi logo resmi Puskesmas, dan sistem aset logo
            Iniyandit Application Center.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadOriginalLogoSvg}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Logo SVG</span>
          </button>
          <a
            href="/icon-512.png?v=2"
            download="Icon-Iniyandit-Application-Center-512.png"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Unduh App Icon PNG</span>
          </a>
        </div>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-7 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="setting-portal-name"
              className="block text-xs font-bold text-[#0F172A] mb-1.5"
            >
              Nama Portal Aplikasi
            </label>
            <input
              id="setting-portal-name"
              type="text"
              required
              maxLength={120}
              value={formData.portalName}
              onChange={(e) => setFormData((prev) => ({ ...prev, portalName: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div>
            <label
              htmlFor="setting-institution-name"
              className="block text-xs font-bold text-[#0F172A] mb-1.5"
            >
              Nama Institusi Puskesmas
            </label>
            <input
              id="setting-institution-name"
              type="text"
              required
              maxLength={120}
              value={formData.institutionName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, institutionName: e.target.value }))
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <label
              htmlFor="setting-tagline"
              className="block text-xs font-bold text-[#0F172A] mb-1.5"
            >
              Tagline Portal
            </label>
            <input
              id="setting-tagline"
              type="text"
              required
              maxLength={200}
              value={formData.tagline}
              onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div>
            <label
              htmlFor="setting-primary-color"
              className="block text-xs font-bold text-[#0F172A] mb-1.5"
            >
              Warna Utama (Primary HEX)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                className="w-11 h-10 rounded-xl border border-[#E2E8F0] cursor-pointer p-1 bg-white"
                aria-label="Pemilih warna utama"
              />
              <input
                id="setting-primary-color"
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono focus:outline-none focus:border-[#14B8A6]"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="setting-description"
            className="block text-xs font-bold text-[#0F172A] mb-1.5"
          >
            Deskripsi Portal
          </label>
          <textarea
            id="setting-description"
            rows={2}
            required
            maxLength={600}
            value={formData.portalDescription}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, portalDescription: e.target.value }))
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#14B8A6]"
          />
        </div>

        {/* Logo Integration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
          {/* Option 1: Official UPTD Puskesmas Iniyandit Emblem Integration */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
              {formData.officialLogoUrl ? (
                <img
                  src={formData.officialLogoUrl}
                  alt="Logo Resmi Puskesmas"
                  className="w-full h-full object-contain"
                />
              ) : (
                <IniyanditIconSvg size={48} idPrefix="settings-official-preview" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#0F172A]">
                Integrasi Logo Resmi UPTD Puskesmas Iniyandit (Opsional)
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                Unggah logo resmi Puskesmas atau Pemda untuk ditampilkan berdampingan dengan logo
                Iniyandit Application Center.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input
                  ref={officialLogoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleUploadPortalLogo(e, 'officialLogoUrl')}
                  className="hidden"
                  id="official-logo-upload"
                />
                <label
                  htmlFor="official-logo-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#0F766E] hover:bg-slate-50 cursor-pointer"
                >
                  {uploadingOfficialLogo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Upload Logo Puskesmas</span>
                </label>
                {formData.officialLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, officialLogoUrl: '' }))}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Option 2: Override Primary Portal Logo */}
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Custom Logo Portal"
                  className="w-full h-full object-contain"
                />
              ) : (
                <IniyanditIconSvg size={48} idPrefix="settings-custom-preview" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#0F172A]">
                Ikon Utama Portal ({formData.logoUrl ? 'Kustom' : 'Vector SVG Original Baru'})
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                Secara bawaan menggunakan logo vector SVG original Iniyandit Application Center.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <input
                  ref={customLogoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => handleUploadPortalLogo(e, 'logoUrl')}
                  className="hidden"
                  id="custom-portal-logo-upload"
                />
                <label
                  htmlFor="custom-portal-logo-upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#0F766E] hover:bg-slate-50 cursor-pointer"
                >
                  {uploadingCustomLogo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Ganti Ikon Kustom</span>
                </label>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#0F766E] hover:bg-teal-50 cursor-pointer"
                  >
                    Gunakan Logo SVG Original
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Brand Identity & 6 Logo Variants Showcase (Section 1 & 9) */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <Palette className="w-5 h-5 text-[#0F766E]" />
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">
              Sistem Identitas Visual &amp; 6 Varian Logo Baru (PWA &amp; Vector Ready)
            </h3>
            <p className="text-xs text-[#64748B]">
              Desain original simbol kesehatan digital, siluet pelayanan, daun pertumbuhan, dan
              piksel integrasi aplikasi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Logo Utama Berbentuk Square Rounded */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center text-center">
            <IniyanditLogo variant="square" size={76} />
            <p className="text-xs font-bold text-[#0F172A] mt-3">
              1. Logo Utama (Square Rounded)
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Bentuk bingkai rounded square modern dengan gradien putih-mint
            </p>
          </div>

          {/* 2. Logo Horizontal */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center text-center">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <IniyanditLogo
                variant="horizontal"
                size={42}
                portalName={formData.portalName}
                institutionName={formData.institutionName}
              />
            </div>
            <p className="text-xs font-bold text-[#0F172A] mt-3">
              2. Logo Horizontal Header
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Dengan tipografi Iniyandit Application Center &amp; aksen daun
            </p>
          </div>

          {/* 3. Logo Icon Tanpa Tulisan */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center text-center">
            <IniyanditLogo variant="icon" size={76} />
            <p className="text-xs font-bold text-[#0F172A] mt-3">
              3. Logo Icon Tanpa Tulisan
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Simbol utama transparan untuk komponen UI dan badge aplikasi
            </p>
          </div>

          {/* 4. Favicon Browser */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <IniyanditLogo variant="favicon" size={36} />
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <IniyanditLogo variant="favicon" size={22} />
              </div>
            </div>
            <p className="text-xs font-bold text-[#0F172A] mt-3">4. Favicon Browser</p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Tajam pada tab browser (favicon.svg &amp; favicon.ico)
            </p>
          </div>

          {/* 5. App Icon untuk PWA */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center text-center">
            <IniyanditLogo variant="pwa" size={76} />
            <p className="text-xs font-bold text-[#0F172A] mt-3">
              5. App Icon untuk PWA (192px &amp; 512px)
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Mendukung Web App Manifest (any &amp; maskable safe-zone)
            </p>
          </div>

          {/* 6. Icon Shortcut Desktop dan Smartphone */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-2xl bg-slate-900/90 shadow-md">
                <IniyanditLogo variant="shortcut" size={56} />
              </div>
              <div className="p-1.5 rounded-2xl bg-white border border-slate-200 shadow-md">
                <IniyanditLogo variant="shortcut" size={44} />
              </div>
            </div>
            <p className="text-xs font-bold text-[#0F172A] mt-3">
              6. Shortcut Desktop &amp; Smartphone
            </p>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Apple Touch Icon (180×180) &amp; Android Add to Home Screen
            </p>
          </div>
        </div>
      </section>

      {/* Official Designer & Developer Identity Section (Section 10) */}
      <section className="bg-linear-to-r from-[#064E3B] via-[#0F766E] to-[#0D9488] rounded-2xl p-6 sm:p-7 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shrink-0">
              <Code2 className="w-7 h-7 text-[#A3E635]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-teal-100 text-[11px] font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>Application Designer &amp; Developer</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                Sulfikri Hidayat, S.Tr.Kes.
              </h3>
              <p className="text-xs sm:text-sm text-teal-100 mt-0.5">
                Perancang dan Pengembang Aplikasi — Iniyandit Application Center (UPTD Puskesmas
                Iniyandit)
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end justify-center gap-1.5 shrink-0 border-t md:border-t-0 border-white/15 pt-3 md:pt-0">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#0F766E] text-xs font-extrabold w-fit">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Dirancang dan Dikembangkan oleh Sulfikri Hidayat, S.Tr.Kes.</span>
            </span>
            <span className="text-[11px] text-teal-100/85">
              © {new Date().getFullYear()} Iniyandit Application Center · UPTD Puskesmas Iniyandit
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
