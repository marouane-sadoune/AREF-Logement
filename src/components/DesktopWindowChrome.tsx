import React from 'react';
import { 
  Minus, 
  Square, 
  X, 
  Home, 
  ShieldCheck, 
  Maximize2,
  Calendar,
  Clock,
  Laptop,
  Users,
} from 'lucide-react';
import { HousingDossier } from '../types/housing';

interface DesktopWindowChromeProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  dossiers: HousingDossier[];
}

export const DesktopWindowChrome: React.FC<DesktopWindowChromeProps> = ({
  isFullscreen,
  onToggleFullscreen,
  dossiers
}) => {
  const currentDate = new Date().toLocaleDateString('ar-MA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalCount = dossiers.length;
  const underReviewCount = dossiers.filter(d => d.status === 'under_review_dp' || d.status === 'submitted_dp').length;
  const transmittedCount = dossiers.filter(d => d.status === 'transmitted_aref').length;
  const approvedCount = dossiers.filter(d => d.status === 'approved').length;

  return (
    <div className="bg-slate-900 text-slate-200 px-4 py-2 flex items-center justify-between select-none border-b border-slate-800 text-xs desktop-titlebar z-50">
      {/* Right side (RTL Start): App Identity & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
          <Home className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-100 text-sm tracking-wide">
            تدبير السكن الإداري والوظيفي
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-emerald-400 font-medium">جهة الشرق (AREF Oriental)</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-300 font-medium text-[11px] hidden sm:inline">
            المذكرة الوزارية 40
          </span>
        </div>
      </div>

      {/* Center: Dossier processing summary */}
      <div className="hidden shrink-0 items-center gap-1.5 text-[10px] lg:flex" aria-label="حالة معالجة الملفات">
        <div className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-slate-200">
          <span className="font-mono font-bold text-white">{totalCount}</span>
          <span>كل الملفات</span>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-amber-950/70 px-2 py-1 text-amber-200">
          <span className="font-mono font-bold text-amber-100">{underReviewCount}</span>
          <span>قيد DP</span>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-blue-950/70 px-2 py-1 text-blue-200">
          <span className="font-mono font-bold text-blue-100">{transmittedCount}</span>
          <span>إلى AREF</span>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-emerald-950/70 px-2 py-1 text-emerald-200">
          <span className="font-mono font-bold text-emerald-100">{approvedCount}</span>
          <span>مصادق</span>
        </div>
      </div>

      {/* Left side (RTL End): Window Controls */}
      <div className="flex items-center gap-2" dir="ltr">
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "تصغير النافذة" : "تكبير ملء الشاشة"}
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          {isFullscreen ? <Square className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
        <button
          title="تصغير للأسفل"
          className="w-7 h-7 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          title="إغلاق التطبيق"
          className="w-7 h-7 rounded hover:bg-rose-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

