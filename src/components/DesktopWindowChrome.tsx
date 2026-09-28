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
  ChevronDown,
  Building,
  Stamp,
  FileCheck2,
  Code
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface DesktopWindowChromeProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenUserSwitcher?: () => void;
}

export const DesktopWindowChrome: React.FC<DesktopWindowChromeProps> = ({
  isFullscreen,
  onToggleFullscreen,
  onOpenUserSwitcher
}) => {
  const { currentUser } = useAuth();

  const currentDate = new Date().toLocaleDateString('ar-MA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'dev':
        return {
          title: 'المسؤول التقني (Super Admin)',
          bg: 'bg-purple-900/60 text-purple-200 border-purple-500/40',
          dot: 'bg-purple-400'
        };
      case 'aref_director':
        return {
          title: 'مدير الأكاديمية (صاحب القرار)',
          bg: 'bg-amber-900/60 text-amber-200 border-amber-500/40',
          dot: 'bg-amber-400'
        };
      case 'aref_validator':
        return {
          title: 'مدقق الأكاديمية (AREF)',
          bg: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40',
          dot: 'bg-emerald-400'
        };
      case 'dp_agent':
      default:
        return {
          title: currentUser.dpNameAr ? `ممثل ${currentUser.dpNameAr}` : 'ممثل المديرية (DP)',
          bg: 'bg-blue-900/60 text-blue-200 border-blue-500/40',
          dot: 'bg-blue-400'
        };
    }
  };

  const roleMeta = getRoleBadge(currentUser.role);

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

      {/* Center: Active User Profile & Quick Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenUserSwitcher}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs transition-all hover:brightness-110 cursor-pointer ${roleMeta.bg}`}
          title="اضغط لتبديل المستخدم واختبار الأدوار الأربعة"
        >
          <span className={`w-2 h-2 rounded-full ${roleMeta.dot} animate-pulse`} />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-100">{currentUser.fullName}</span>
            <span className="text-[10px] opacity-80">({roleMeta.title})</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>
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

