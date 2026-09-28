import React, { useState } from 'react';
import { 
  Database, 
  Table, 
  ExternalLink, 
  Check, 
  Copy, 
  Download, 
  Terminal, 
  HardDrive,
  Info,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { HousingDossier, ORIENTAL_DIRECTORATES } from '../types/housing';
import { generateArefOrientalSql } from '../utils/generateSqlDump';

interface PhpMyAdminModalProps {
  dossiers: HousingDossier[];
  onClose: () => void;
}

export const PhpMyAdminModal: React.FC<PhpMyAdminModalProps> = ({
  dossiers,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'sql' | 'instructions'>('tables');

  const sqlDump = generateArefOrientalSql(dossiers);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlDump);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlDump], { type: 'application/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aref_oriental_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tablesMeta = [
    {
      name: 'directions_provinciales',
      rows: 8,
      desc: 'قائمة المديريات الإقليمية الثماني لجهة الشرق (وجدة، بركان، الناظور، الدريوش، تاوريرت، جرسيف، جرادة، فكيك).',
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci'
    },
    {
      name: 'utilisateurs',
      rows: 11,
      desc: 'الأدوار الأربعة للمستخدمين (dp_agent، aref_validator، aref_director، dev) والارتباطات الإقليمية بالمديريات الـ 8.',
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci'
    },
    {
      name: 'candidats',
      rows: dossiers.length,
      desc: 'بيانات المترشحين، أرقام التأجير (PPR)، البطاقة الوطنية (CIN)، الإطار والسلم والأقدمية ومقر العمل.',
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci'
    },
    {
      name: 'demandes_logement',
      rows: dossiers.length,
      desc: 'طلبات السكن الوظيفي والإداري، المؤسسة المستهدفة، حالة السكن، ومسار المعالجة من DP إلى AREF.',
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci'
    },
    {
      name: 'documents_fournis',
      rows: dossiers.length,
      desc: 'تدقيق الوثائق الـ 6 الإلزامية للمذكرة 40 (الطلب، CIN، شهادة العمل، الوضع العائلي، الالتزام، محضر الالتحاق).',
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci'
    },
    {
      name: 'baremes_detail',
      rows: dossiers.length,
      desc: 'تفاصيل النقط وشبكة التنقيط المعيارية للمذكرة 40 (الأقدمية العامة، المؤسسة، السلم، العائلة، الأطفال، والمسؤولية).',
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci'
    },
    {
      name: 'audit_historique',
      rows: dossiers.reduce((acc, d) => acc + (d.auditHistory?.length || 0), 0),
      desc: 'سجل تدقيق الإجراءات والقرارات الصادرة عن مكتب الضبط ومصلحة الموارد البشرية ولجنة الأكاديمية.',
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* phpMyAdmin Institutional Header */}
        <div className="bg-[#2c3e50] text-white p-4 flex items-center justify-between border-b-4 border-[#e67e22] select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#1a252f] px-2.5 py-1 rounded text-amber-400 font-mono text-xs font-bold border border-slate-700">
              <Server className="w-3.5 h-3.5" />
              <span>phpMyAdmin / MySQL</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-300">
                  localhost ➔ aref_oriental
                </span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                  utf8mb4_unicode_ci
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                قاعدة بيانات السكن الوظيفي والإداري - جهة الشرق (8 مديريات إقليمية)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSql}
              className="px-3 py-1.5 bg-[#e67e22] hover:bg-[#d35400] text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل aref_oriental.sql</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors text-base font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* phpMyAdmin Sub-bar URL preview */}
        <div className="bg-[#f8f9fa] border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono select-all">
          <div className="flex items-center gap-2 text-slate-600 truncate">
            <Database className="w-3.5 h-3.5 text-[#e67e22]" />
            <span className="text-slate-400">Database:</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              aref_oriental
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              http://localhost/phpmyadmin/index.php?route=/database/structure&db=aref_oriental
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                activeTab === 'tables' ? 'bg-[#2c3e50] text-white' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              بنية الجداول (Structure)
            </button>
            <button
              onClick={() => setActiveTab('sql')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                activeTab === 'sql' ? 'bg-[#2c3e50] text-white' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              أوامر SQL Dump
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                activeTab === 'instructions' ? 'bg-[#2c3e50] text-white' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              طريقة التثبيت في phpMyAdmin
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: Database Structure (phpMyAdmin Table Structure style) */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#e67e22] shrink-0 mt-0.5" />
                <div>
                  <strong>تم توليد بنية قاعدة البيانات `aref_oriental`:</strong> تحتوي على 6 جداول مترابطة بعلاقات مفاتيح أجنبية لضمان سلامة بيانات السكن، وتضم 8 مديريات إقليمية بجهة الشرق وجميع ملفات الترشيح المسجلة.
                </div>
              </div>

              {/* phpMyAdmin styled Table Structure */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-right border-collapse">
                  <thead className="bg-[#e9ecef] text-slate-700 font-semibold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">اسم الجدول (Table)</th>
                      <th className="p-2.5">الوصف الإداري والتقني</th>
                      <th className="p-2.5 text-center">الأسطر (Records)</th>
                      <th className="p-2.5 text-center">المحرك (Engine)</th>
                      <th className="p-2.5 text-center">الترميز (Collation)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {tablesMeta.map((t, idx) => (
                      <tr key={t.name} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-2.5 font-bold text-blue-700 flex items-center gap-2">
                          <Table className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.name}</span>
                        </td>
                        <td className="p-2.5 font-sans text-xs text-slate-600">{t.desc}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{t.rows}</td>
                        <td className="p-2.5 text-center text-slate-500">{t.engine}</td>
                        <td className="p-2.5 text-center text-slate-500">{t.collation}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300 text-xs">
                    <tr>
                      <td className="p-2.5 text-slate-800">المجموع: 6 جداول</td>
                      <td className="p-2.5 text-slate-500 font-sans">قاعدة بيانات موحدة لأكاديمية جهة الشرق</td>
                      <td className="p-2.5 text-center font-mono text-emerald-800">
                        {tablesMeta.reduce((acc, t) => acc + t.rows, 0)} سطر
                      </td>
                      <td className="p-2.5 text-center font-mono">InnoDB</td>
                      <td className="p-2.5 text-center font-mono">utf8mb4</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 8 DPs in Database */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <span>جدول المديريات الإقليمية الثماني بالجهة (Table `directions_provinciales`):</span>
                  <span className="text-[11px] text-emerald-700 font-mono">8 DPs de l'Oriental</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {ORIENTAL_DIRECTORATES.map((dp) => (
                    <div key={dp.code} className="bg-white p-2 rounded border border-slate-200">
                      <div className="font-bold text-slate-800 font-mono text-[11px] text-blue-700">{dp.code}</div>
                      <div className="font-medium text-[11px] text-slate-700 truncate">{dp.nameAr}</div>
                      <div className="text-[10px] text-slate-400 truncate">{dp.chiefTown}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL Dump View & Copy */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  محتوى ملف SQL المتوافق مع MySQL 5.7+ و MySQL 8+ و MariaDB:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySql}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ للحافظة!' : 'نسخ كود SQL كامل'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSql}
                    className="px-3 py-1 bg-[#e67e22] hover:bg-[#d35400] text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل .sql</span>
                  </button>
                </div>
              </div>

              <pre className="bg-[#1e293b] text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed select-all">
                {sqlDump}
              </pre>
            </div>
          )}

          {/* TAB 3: How to import into local phpMyAdmin */}
          {activeTab === 'instructions' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-700" />
                  <span>خطوات الاستيراد والتثبيت في phpMyAdmin على جهازك المحلي (XAMPP / WampServer / LAMP):</span>
                </h4>
                <p className="text-slate-600">
                  قاعدة البيانات <strong>aref_oriental</strong> مهيأة وجاهزة بالكامل لتتوافق مع أي سيرفر محلي يعمل بـ MySQL أو MariaDB.
                </p>
              </div>

              <div className="space-y-3 font-sans">
                <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    1
                  </div>
                  <div>
                    <strong>تحميل ملف الـ SQL:</strong> انقر على زر <strong>"تحميل aref_oriental.sql"</strong> بالأعلى لحفظ ملف قاعدة البيانات على حاسوبك.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    2
                  </div>
                  <div>
                    <strong>فتح phpMyAdmin:</strong> افتح متصفحك على الرابط المحلي الخاص بك:
                    <div className="bg-slate-100 p-2 rounded font-mono text-[11px] text-blue-700 mt-1 select-all" dir="ltr">
                      http://localhost/phpmyadmin/
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    3
                  </div>
                  <div>
                    <strong>استيراد الملف (Import):</strong> 
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                      <li>اضغط على تبويب <strong>Import (استيراد)</strong> في القائمة العلوية لـ phpMyAdmin.</li>
                      <li>اختر ملف <code>aref_oriental.sql</code> الذي قمت بتحميله.</li>
                      <li>اضغط على زر <strong>Import / Go (تنفيذ)</strong> بأسفل الصفحة.</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    4
                  </div>
                  <div>
                    <strong>النتيجة المباشرة:</strong> ستظهر لك قاعدة البيانات باسم <code>aref_oriental</code>، وعند الدخول إليها ستجد الرابط المطلوب:
                    <div className="bg-slate-100 p-2 rounded font-mono text-[11px] text-emerald-800 mt-1 select-all" dir="ltr">
                      http://localhost/phpmyadmin/index.php?route=/database/structure&db=aref_oriental
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-mono">
            DB: aref_oriental | Records: {dossiers.length} dossiers | 8 DPs
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold cursor-pointer"
            >
              {copied ? 'تم النسخ!' : 'نسخ كود SQL'}
            </button>
            <button
              onClick={handleDownloadSql}
              className="px-4 py-1.5 bg-[#e67e22] hover:bg-[#d35400] text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل ملف aref_oriental.sql</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
