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
import { DossierDetailModal } from './components/DossierDetailModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { UserManagementView } from './components/UserManagementView';
import { HousingDossier, DossierStatus } from './types/housing';
import { INITIAL_DOSSIERS } from './data/mockDossiers';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as api from './api/client';

function DesktopHousingApp() {
  const { currentUser, permissions } = useAuth();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dossiers');
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  // Dossiers are loaded from the Laravel API; the backend is the source of truth.
  const [dossiers, setDossiers] = useState<HousingDossier[]>([]);
  const [isLoadingDossiers, setIsLoadingDossiers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // State for modals and active selections
  const [selectedDossier, setSelectedDossier] = useState<HousingDossier | null>(null);
  const [editingDossier, setEditingDossier] = useState<HousingDossier | null>(null);
  const [auditDossier, setAuditDossier] = useState<HousingDossier | null>(null);
  const [printDossierId, setPrintDossierId] = useState<string | undefined>(undefined);
  const [defaultDocType, setDefaultDocType] = useState<string>('demande');

  useEffect(() => {
    api
      .fetchDossiers()
      .then(setDossiers)
      .catch((e) => setLoadError(e.message))
      .finally(() => setIsLoadingDossiers(false));
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSaveDossier = async (saved: HousingDossier, docFiles?: Record<string, File | undefined>) => {
    const existsIndex = dossiers.findIndex((d) => d.id === saved.id);
    let dossierId = saved.id;

    if (existsIndex < 0) {
      try {
        const created = await api.createDossier(saved);
        dossierId = created.id;
        setDossiers((prev) => [created, ...prev]);
      } catch (e) {
        alert('فشل إنشاء الملف في الخادم: ' + (e as Error).message);
        return;
      }
    } else {
      // No backend endpoint yet for full dossier edits (only status
      // transitions have one) -- update the local copy only.
      setDossiers((prev) => {
        const updated = [...prev];
        updated[existsIndex] = saved;
        return updated;
      });
    }

    // Upload any staged "Dossier de Demande" files (step 4) now that the
    // dossier has a real backend id, so the DP agent can inspect them.
    const filesToUpload = Object.entries(docFiles || {}).filter(
      (entry): entry is [string, File] => !!entry[1]
    );
    if (filesToUpload.length > 0) {
      try {
        await Promise.all(
          filesToUpload.map(([key, file]) => api.uploadDossierDocument(dossierId, key, file))
        );
        const refreshed = await api.fetchDossier(dossierId);
        setDossiers((prev) => prev.map((d) => (d.id === dossierId ? refreshed : d)));
      } catch (e) {
        alert('فشل رفع بعض الوثائق: ' + (e as Error).message);
      }
    }

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

  const handleUpdateStatus = async (
    updatedDossier: HousingDossier,
    newStatus: DossierStatus,
    comment: string,
    bordereauNumber?: string
  ) => {
    let finalDossier: HousingDossier;
    try {
      const fresh = await api.updateDossierStatus(updatedDossier.id, {
        status: newStatus,
        comment,
        acteur: `${currentUser.fullName} (${currentUser.title})`,
        numero_bordereau_dp: bordereauNumber || updatedDossier.dpAudit?.bordereauNumber,
        date_transmission_aref: updatedDossier.dpAudit?.transmissionDate,
        numero_decision_aref: updatedDossier.arefDecision?.decisionNumber,
        date_commission_aref: updatedDossier.arefDecision?.commissionDate,
      });
      finalDossier = {
        ...fresh,
        dpAudit: {
          ...(updatedDossier.dpAudit || {}),
          ...(fresh.dpAudit || {}),
          isComplete: fresh.dpAudit?.isComplete ?? updatedDossier.dpAudit?.isComplete ?? false,
        },
        arefDecision: { ...(updatedDossier.arefDecision || {}), ...fresh.arefDecision },
      };
    } catch (e) {
      alert('فشل تحديث حالة الملف في الخادم: ' + (e as Error).message);
      return;
    }

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

  if (isLoadingDossiers) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 text-slate-500 text-sm">
        جاري تحميل الملفات من الخادم...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 text-red-600 text-sm px-6 text-center">
        تعذر الاتصال بالخادم: {loadError}
      </div>
    );
  }

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
