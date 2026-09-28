/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DesktopWindowChrome } from './components/DesktopWindowChrome';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DossierList } from './components/DossierList';
import { DossierForm } from './components/DossierForm';
import { DocumentGenerator } from './components/DocumentGenerator';
import { AuditWorkflowModal } from './components/AuditWorkflowModal';
import { RegulationsGuide } from './components/RegulationsGuide';
import { DatabaseBackup } from './components/DatabaseBackup';
import { LaravelBackendViewer } from './components/LaravelBackendViewer';
import { DossierDetailModal } from './components/DossierDetailModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { UserManagementView } from './components/UserManagementView';
import { HousingDossier, DossierStatus } from './types/housing';
import { INITIAL_DOSSIERS } from './data/mockDossiers';
import { AuthProvider, useAuth } from './context/AuthContext';

const LOCAL_STORAGE_KEY = 'morocco_housing_note40_dossiers';

function DesktopHousingApp() {
  const { currentUser, permissions } = useAuth();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dossiers');
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  // Load dossiers from local storage or default to initial dossiers
  const [dossiers, setDossiers] = useState<HousingDossier[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load dossiers from local storage', e);
    }
    return INITIAL_DOSSIERS;
  });

  // State for modals and active selections
  const [selectedDossier, setSelectedDossier] = useState<HousingDossier | null>(null);
  const [editingDossier, setEditingDossier] = useState<HousingDossier | null>(null);
  const [auditDossier, setAuditDossier] = useState<HousingDossier | null>(null);
  const [printDossierId, setPrintDossierId] = useState<string | undefined>(undefined);
  const [defaultDocType, setDefaultDocType] = useState<string>('demande');

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dossiers));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }, [dossiers]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSaveDossier = (saved: HousingDossier) => {
    setDossiers((prev) => {
      const existsIndex = prev.findIndex((d) => d.id === saved.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = saved;
        return updated;
      } else {
        return [saved, ...prev];
      }
    });

    setEditingDossier(null);
    setActiveTab('dossiers');
  };

  const handleDeleteDossier = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الملف نهائياً من النظام؟')) {
      setDossiers((prev) => prev.filter((d) => d.id !== id));
      if (selectedDossier?.id === id) setSelectedDossier(null);
      if (editingDossier?.id === id) setEditingDossier(null);
      if (auditDossier?.id === id) setAuditDossier(null);
    }
  };

  const handleUpdateStatus = (
    updatedDossier: HousingDossier,
    newStatus: DossierStatus,
    comment: string,
    bordereauNumber?: string
  ) => {
    const newHistoryEntry = {
      stage: (newStatus === 'under_review_dp'
        ? 'audit_dp'
        : newStatus === 'transmitted_aref'
        ? 'transmission_aref'
        : newStatus === 'approved'
        ? 'final_decision'
        : 'audit_dp') as any,
      date: new Date().toLocaleString('ar-MA'),
      actor: `${currentUser.fullName} (${currentUser.title})`,
      decision:
        newStatus === 'under_review_dp'
          ? 'تدقيق ومطابقة الملف بالمديرية (DP)'
          : newStatus === 'transmitted_aref'
          ? `إحالة وقفل الملف على الأكاديمية الجهوية (جدول إرسال: ${bordereauNumber || 'BORD'})`
          : newStatus === 'approved'
          ? 'المصادقة ومنح الترخيص النهائي بشغل السكن'
          : 'رفض الطلب لعدم الاستيفاء',
      comment
    };

    const finalDossier: HousingDossier = {
      ...updatedDossier,
      status: newStatus,
      auditHistory: [newHistoryEntry, ...(updatedDossier.auditHistory || [])]
    };

    setDossiers((prev) =>
      prev.map((d) => (d.id === finalDossier.id ? finalDossier : d))
    );

    setAuditDossier(null);
    if (selectedDossier?.id === finalDossier.id) {
      setSelectedDossier(finalDossier);
    }
  };

  const handleOpenPrint = (dossier: HousingDossier, docType: string = 'demande') => {
    setPrintDossierId(dossier.id);
    setDefaultDocType(docType);
    setActiveTab('documents');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 select-none">
      {/* Desktop App Window Chrome Title Bar */}
      <DesktopWindowChrome
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenUserSwitcher={() => setShowUserSwitcher(true)}
      />

      {/* Main Desktop Workspace with Sidebar & Content Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Institutional Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'new_dossier') {
              setEditingDossier(null);
            }
          }}
          dossiers={dossiers}
          onOpenNewDossier={() => {
            setEditingDossier(null);
            setActiveTab('new_dossier');
          }}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/90 relative">
          <div className="max-w-6xl mx-auto">
            {/* View: Dossiers List */}
            {activeTab === 'dossiers' && (
              <DossierList
                dossiers={dossiers}
                onSelectDossier={(d) => setSelectedDossier(d)}
                onOpenNewDossier={() => {
                  setEditingDossier(null);
                  setActiveTab('new_dossier');
                }}
                onEditDossier={(d) => {
                  setEditingDossier(d);
                  setActiveTab('new_dossier');
                }}
                onOpenAudit={(d) => setAuditDossier(d)}
                onPrintDocuments={(d) => handleOpenPrint(d, d.status === 'approved' ? 'accord_attribution' : 'demande')}
                onDeleteDossier={handleDeleteDossier}
              />
            )}

            {/* View: Create / Edit Dossier */}
            {activeTab === 'new_dossier' && (
              <DossierForm
                initialDossier={editingDossier}
                onSave={handleSaveDossier}
                onCancel={() => {
                  setEditingDossier(null);
                  setActiveTab('dossiers');
                }}
              />
            )}

            {/* View: Official Documents Generator & Printing */}
            {activeTab === 'documents' && (
              <DocumentGenerator
                dossiers={dossiers}
                selectedDossierId={printDossierId}
                defaultDocType={defaultDocType}
              />
            )}

            {/* View: Audit Workflow (DP -> AREF) */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                        الأكاديمية الجهوية للتربية والتكوين - جهة الشرق
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-500">8 مديريات إقليمية (DP)</span>
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-900">
                      مسار التدقيق والإحالة الإدارية (DPs ➔ AREF Oriental)
                    </h1>
                    <p className="text-xs text-slate-600 mt-1">
                      تدقيق الملفات وتوليد جداول الإرسال الرسمية للمديريات الثماني: وجدة، بركان، الناظور، الدريوش، تاوريرت، جرسيف، جرادة، وفكيك.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dossiers.map((d) => (
                    <div
                      key={d.id}
                      className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {d.referenceNumber}
                        </span>
                        <span className="text-xs text-slate-400">{d.candidate.directionProvinciale}</span>
                      </div>

                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{d.candidate.fullNameAr}</h2>
                        <div className="text-xs text-slate-500">{d.candidate.grade} · {d.candidate.currentEtablissement}</div>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>نوع السكن: <strong>{d.housingRequest.housingType === 'fonction' ? 'وظيفي' : 'إداري'}</strong></span>
                        <span>مجموع النقط: <strong className="font-mono text-emerald-800">{d.bareme.totalPts}</strong></span>
                      </div>

                      <button
                        onClick={() => setAuditDossier(d)}
                        className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        معالجة الإجراء والتدقيق الإداري
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View: User Management View (4 Roles & DPs) */}
            {activeTab === 'users' && <UserManagementView />}

            {/* View: Regulations & Circular 40 Guide */}
            {activeTab === 'regulations' && <RegulationsGuide />}

            {/* View: Database & Backup */}
            {activeTab === 'database' && (
              <DatabaseBackup
                dossiers={dossiers}
                onImportDossiers={(newOnes) => setDossiers(newOnes)}
                onResetDossiers={() => setDossiers(INITIAL_DOSSIERS)}
              />
            )}

            {/* View: Laravel Backend Architecture & Code Hub */}
            {activeTab === 'laravel_backend' && <LaravelBackendViewer />}
          </div>
        </main>
      </div>

      {/* Modal: Dossier Inspection & Detail */}
      {selectedDossier && (
        <DossierDetailModal
          dossier={selectedDossier}
          onClose={() => setSelectedDossier(null)}
          onUpdateDossier={(updated) => {
            setDossiers((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            );
            setSelectedDossier(updated);
          }}
          onOpenAudit={(d) => {
            setSelectedDossier(null);
            setAuditDossier(d);
          }}
          onPrintDocuments={(d) => {
            setSelectedDossier(null);
            handleOpenPrint(d, 'demande');
          }}
          onNavigateToDocumentGenerator={(docType) => {
            setSelectedDossier(null);
            handleOpenPrint(selectedDossier, docType);
          }}
        />
      )}

      {/* Modal: Audit & Transmission (DP -> AREF) */}
      {auditDossier && (
        <AuditWorkflowModal
          dossier={auditDossier}
          onClose={() => setAuditDossier(null)}
          onUpdateStatus={handleUpdateStatus}
          onOpenApprovalLetter={(d) => handleOpenPrint(d, 'accord_attribution')}
        />
      )}

      {/* Modal: User Profile Switcher (Testing the 4 Roles) */}
      <UserSwitcherModal
        isOpen={showUserSwitcher}
        onClose={() => setShowUserSwitcher(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DesktopHousingApp />
    </AuthProvider>
  );
}
