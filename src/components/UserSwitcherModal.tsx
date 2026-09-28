import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  CheckCircle, 
  UserCheck, 
  MapPin, 
  Briefcase, 
  Award, 
  X, 
  ArrowRight,
  Code,
  FileCheck2,
  Stamp,
  Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, users, switchUser } = useAuth();
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');

  if (!isOpen) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'dev':
        return {
          label: '4. المطور / المسؤول التقني',
          sub: 'Super Admin',
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: Code,
          desc: 'إنشاء الحسابات، ضبط الصلاحيات، تدبير بنية MySQL وإعدادات النظام العامة'
        };
      case 'aref_director':
        return {
          label: '3. مدير الأكاديمية الجهوية',
          sub: 'Directeur AREF',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: Stamp,
          desc: 'المصادقة النهائية على الإسناد وتوليد وطباعة وثائق وعقود الإسناد الرسمية (PDF)'
        };
      case 'aref_validator':
        return {
          label: '2. مسؤول الأكاديمية الجهوية',
          sub: 'Auditeur AREF',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: FileCheck2,
          desc: 'فحص وتدقيق الملفات من المديريات الـ 8، التحقق من النقط والشروط، والموافقة المبدئية'
        };
      case 'dp_agent':
      default:
        return {
          label: '1. ممثل المديرية الإقليمية',
          sub: 'Agent DP',
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Building,
          desc: 'إدخال وتدبير معطيات السكنيات الخاصة بإقليمه فقط وقفل الملفات وإرسالها للأكاديمية'
        };
    }
  };

  const filteredUsers = selectedRoleFilter === 'all' 
    ? users 
    : users.filter(u => u.role === selectedRoleFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">نظام المستخدمين والصلاحيات الهرمية</h2>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-mono">
                  4 Roles
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                تبديل المستخدم لاختبار صلاحيات التدبير وفق التراتبية الإدارية لجهة الشرق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-xs">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">أنت متصل حالياً بحساب:</span>
                <span className="text-sm font-bold text-slate-900">{currentUser.fullName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getRoleBadge(currentUser.role).bg}`}>
                  {getRoleBadge(currentUser.role).label}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {currentUser.title} {currentUser.dpNameAr ? `· ${currentUser.dpNameAr}` : ''}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>حساب نشط ومفعل</span>
          </div>
        </div>

        {/* Role Quick Filter Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold ml-1">تصفية الأدوار:</span>
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedRoleFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            الكل ({users.length})
          </button>
          <button
            onClick={() => setSelectedRoleFilter('dp_agent')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedRoleFilter === 'dp_agent'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            1. ممثلو المديريات (DP)
          </button>
          <button
            onClick={() => setSelectedRoleFilter('aref_validator')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedRoleFilter === 'aref_validator'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            2. مدقق الأكاديمية (AREF)
          </button>
          <button
            onClick={() => setSelectedRoleFilter('aref_director')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedRoleFilter === 'aref_director'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            3. مدير الأكاديمية
          </button>
          <button
            onClick={() => setSelectedRoleFilter('dev')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedRoleFilter === 'dev'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            4. المسؤول التقني (Dev)
          </button>
        </div>

        {/* Users Grid */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredUsers.map((user) => {
              const roleMeta = getRoleBadge(user.role);
              const RoleIcon = roleMeta.icon;
              const isCurrent = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    switchUser(user.id);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border text-right transition-all cursor-pointer relative ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>الحساب الحالي</span>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${roleMeta.bg}`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {user.fullName}
                        </h3>
                      </div>

                      <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                        {user.username} · {user.email}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${roleMeta.bg}`}>
                          {roleMeta.label}
                        </span>

                        {user.dpNameAr && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-blue-600" />
                            {user.dpNameAr}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                        {roleMeta.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[10px]">
                      {user.lastLogin ? `آخر نشاط: ${user.lastLogin}` : 'حساب مهيأ'}
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${isCurrent ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                      {isCurrent ? 'مفعل الآن' : 'تبديل الحساب'}
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>نظام تسجيل الدخول الهرمي - أكاديمية جهة الشرق</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
