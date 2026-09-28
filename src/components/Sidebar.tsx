import React from 'react';
import { 
  FolderKanban, 
  FilePlus, 
  FileText, 
  GitFork, 
  BookOpen, 
  Database,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Users,
  Shield,
  MapPin,
  Server
} from 'lucide-react';
import { HousingDossier } from '../types/housing';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'dossiers' | 'new_dossier' | 'documents' | 'audit' | 'regulations' | 'database' | 'users' | 'laravel_backend';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dossiers: HousingDossier[];
  onOpenNewDossier: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  dossiers,
  onOpenNewDossier
}) => {
  const { currentUser, permissions } = useAuth();

  const totalCount = dossiers.length;
  const underReviewCount = dossiers.filter(d => d.status === 'under_review_dp' || d.status === 'submitted_dp').length;
  const transmittedCount = dossiers.filter(d => d.status === 'transmitted_aref').length;
  const approvedCount = dossiers.filter(d => d.status === 'approved').length;

  const navItems = [
    {
      id: 'dossiers' as ActiveTab,
      label: 'سجل ملفات الترشيح',
      sublabel: currentUser.role === 'dp_agent' && currentUser.dpNameAr ? `ملفات ${currentUser.dpNameAr}` : 'Dossiers de Candidature',
      icon: FolderKanban,
      badge: totalCount
    },
    ...(permissions.canCreateDossier ? [{
      id: 'new_dossier' as ActiveTab,
      label: 'تكوين ملف طلب جديد',
      sublabel: 'Nouveau Dossier (Note 40)',
      icon: FilePlus,
      highlight: true
    }] : []),
    {
      id: 'documents' as ActiveTab,
      label: 'مولد الوثائق والطباعة',
      sublabel: currentUser.role === 'aref_director' ? 'عقود الإسناد الرسمية' : 'Documents & Déclarations',
      icon: FileText
    },
    {
      id: 'audit' as ActiveTab,
      label: 'مسار التدقيق (DP ➔ AREF)',
      sublabel: currentUser.role === 'aref_validator' ? 'التدقيق الجهوي (AREF)' : 'Circuit & Décisions',
      icon: GitFork,
      badge: underReviewCount > 0 ? underReviewCount : undefined
    },
    {
      id: 'users' as ActiveTab,
      label: 'المستخدمون والأدوار الأربعة',
      sublabel: 'DP / AREF / Director / Dev',
      icon: Users
    },
    {
      id: 'regulations' as ActiveTab,
      label: 'دليل المذكرة الوزارية 40',
      sublabel: 'Cadre Juridique & Barème',
      icon: BookOpen
    },
    {
      id: 'database' as ActiveTab,
      label: 'قاعدة البيانات (MySQL / phpMyAdmin)',
      sublabel: 'DB: aref_oriental',
      icon: Database
    },
    {
      id: 'laravel_backend' as ActiveTab,
      label: 'الخادم الخلفي (PHP Laravel)',
      sublabel: 'API, Models & Blade Views',
      icon: Server
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-full border-l border-slate-800 shrink-0 desktop-sidebar select-none">
      {/* Institutional Moroccan Header - Oriental Region */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-1">
            <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-xs font-bold text-slate-100 leading-tight">المملكة المغربية</h2>
          <p className="text-[11px] text-emerald-400 font-semibold leading-tight">
            الأكاديمية الجهوية للتربية والتكوين
          </p>
          <div className="text-xs text-amber-300 font-bold">
            جـهـة الـشـرق (AREF Oriental)
          </div>
          <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800 mt-1">
            8 مديريات إقليمية (DP) · قسم السكنيات
          </div>
        </div>
      </div>

      {/* Primary Action Button - Accessible for roles with creation rights */}
      {permissions.canCreateDossier && (
        <div className="p-3">
          <button
            onClick={onOpenNewDossier}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>إيداع ملف سكن جديد</span>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-right transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 font-bold border-r-2 border-emerald-400'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs leading-none">{item.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{item.sublabel}</div>
                </div>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-slate-800 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active User Status Badge at bottom */}
      <div className="p-3 mx-3 my-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">الحساب المتصل:</span>
          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
            {currentUser.role}
          </span>
        </div>
        <div className="font-bold text-slate-100 truncate">{currentUser.fullName}</div>
        {currentUser.dpNameAr && (
          <div className="flex items-center gap-1 text-blue-400 text-[10px] font-medium truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{currentUser.dpNameAr}</span>
          </div>
        )}
      </div>

      {/* Quick Summary Widget */}
      <div className="p-3 mx-3 mb-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] space-y-1.5">
        <div className="text-slate-400 font-semibold flex items-center justify-between pb-1 border-b border-slate-800">
          <span>حالة المعالجة</span>
          <span className="font-mono text-slate-300">{totalCount} ملفات</span>
        </div>
        
        <div className="flex items-center justify-between text-amber-300">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>تدقيق بالمديرية (DP)</span>
          </span>
          <span className="font-mono font-bold">{underReviewCount}</span>
        </div>

        <div className="flex items-center justify-between text-blue-300">
          <span className="flex items-center gap-1.5">
            <Send className="w-3 h-3" />
            <span>محال على الأكاديمية (AREF)</span>
          </span>
          <span className="font-mono font-bold">{transmittedCount}</span>
        </div>

        <div className="flex items-center justify-between text-emerald-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>مصادق عليه وممنوح</span>
          </span>
          <span className="font-mono font-bold">{approvedCount}</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span>نسخة التطبيق: 2.5 (مكتبية)</span>
        <span className="text-emerald-500 font-semibold">المذكرة 40</span>
      </div>
    </aside>
  );
};

