import React, { useEffect, useRef } from 'react';
import {
  X,
  FileText,
  FileImage,
  File,
  ExternalLink,
  Download,
  Stamp,
  CheckCircle2,
  XCircle,
  Calendar,
  Paperclip,
  AlertTriangle,
  Eye,
  ZoomIn,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
export interface DocumentPreviewCardData {
  id: string;
  titleAr: string;
  descAr: string;
  isPresent: boolean;
  legalizationNeeded: boolean;
  isLegalized?: boolean;
  fileName?: string;
  date?: string;
  notes?: string;
  fileUrl?: string;
}

interface Props {
  data: DocumentPreviewCardData;
  onClose: () => void;
}

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function isImageFile(name?: string) {
  if (!name) return false;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
}

function fileTypeLabel(name?: string) {
  if (!name) return 'غير محدد';
  return name.split('.').pop()?.toUpperCase() ?? 'ملف';
}

function FileIcon({ name }: { name?: string }) {
  if (!name) return <File className="w-12 h-12 text-slate-300" />;
  if (isImageFile(name)) return <FileImage className="w-12 h-12 text-sky-400" />;
  return <FileText className="w-12 h-12 text-rose-400" />;
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */
export const DocumentPreviewCard: React.FC<Props> = ({ data, onClose }) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isImg = isImageFile(data.fileName);

  return (
    <div
      ref={backdropRef}
      onClick={(e) => e.target === backdropRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`معاينة: ${data.titleAr}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(2,6,23,0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'dpFadeIn 0.18s ease',
      }}
    >
      <style>{`
        @keyframes dpFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes dpSlideUp { from { transform:translateY(24px); opacity:0 } to { transform:translateY(0); opacity:1 } }
        .dp-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          width: 100%;
          max-width: 520px;
          max-height: 92vh;
          box-shadow: 0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08);
          animation: dpSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .dp-media {
          position: relative;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%);
          min-height: 176px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .dp-media img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          max-height: 240px;
        }
        .dp-media-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 32px;
        }
        .dp-file-type-badge {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
          background: rgba(255,255,255,0.07);
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .dp-open-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          padding: 7px 16px;
          background: rgba(99,102,241,0.85);
          color: #fff;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s;
        }
        .dp-open-link:hover { background: rgba(99,102,241,1); }
        .dp-status-pill {
          position: absolute;
          top: 12px;
          right: 12px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          backdrop-filter: blur(8px);
        }
        .dp-status-pill.present {
          background: rgba(16,185,129,0.2);
          color: #34d399;
          border: 1px solid rgba(52,211,153,0.35);
        }
        .dp-status-pill.missing {
          background: rgba(245,158,11,0.2);
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.35);
        }
        .dp-header {
          padding: 18px 20px 12px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }
        .dp-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .dp-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.45;
          flex: 1;
        }
        .dp-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          color: #64748b;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
          flex-shrink: 0;
        }
        .dp-close:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
        .dp-badges { display: flex; flex-wrap: wrap; gap: 6px; }
        .dp-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 999px;
          border: 1px solid transparent;
        }
        .dp-badge-mandatory { background:#fef3c7; color:#92400e; border-color:#fde68a; }
        .dp-badge-legalize  { background:#f5f3ff; color:#6d28d9; border-color:#ddd6fe; }
        .dp-badge-legalized { background:#ecfdf5; color:#065f46; border-color:#6ee7b7; }
        .dp-body {
          padding: 16px 20px;
          overflow-y: auto;
          flex: 1;
          min-height: 0;
        }
        .dp-desc {
          font-size: 12.5px;
          color: #475569;
          line-height: 1.75;
          margin: 0;
        }
        .dp-notes {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin-top: 12px;
          padding: 10px 12px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          font-size: 12px;
          color: #78350f;
        }
        .dp-meta {
          padding: 10px 20px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
          background: #fafafa;
        }
        .dp-meta-row {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11.5px;
          color: #64748b;
        }
        .dp-meta-label { color: #94a3b8; }
        .dp-meta-value { color: #334155; font-weight: 500; }
        /* ── Footer: margin-top:auto keeps equal-height cards even ── */
        .dp-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .dp-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          border: 1px solid transparent;
          transition: all 0.13s;
        }
        .dp-action-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          box-shadow: 0 2px 8px rgba(99,102,241,0.35);
        }
        .dp-action-primary:hover { box-shadow: 0 4px 14px rgba(99,102,241,0.45); transform: translateY(-1px); }
        .dp-action-secondary {
          background: #fff;
          color: #475569;
          border-color: #e2e8f0;
        }
        .dp-action-secondary:hover { background: #f1f5f9; }
        .dp-action-ghost {
          background: transparent;
          color: #94a3b8;
          margin-right: auto;
        }
        .dp-action-ghost:hover { color: #ef4444; }
        .dp-no-file {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #94a3b8;
          flex: 1;
        }
      `}</style>

      {/* ── Card ── */}
      <article className="dp-card">

        {/* ══ SLOT 1 — Media ══ */}
        <div className="dp-media">
          {data.fileUrl && isImg ? (
            <img src={data.fileUrl} alt={data.titleAr} />
          ) : (
            <div className="dp-media-placeholder">
              <FileIcon name={data.fileName} />
              <span className="dp-file-type-badge">{fileTypeLabel(data.fileName)}</span>
              {data.fileUrl && !isImg && (
                <a href={data.fileUrl} target="_blank" rel="noreferrer" className="dp-open-link">
                  <Eye className="w-4 h-4" />
                  فتح الملف في نافذة جديدة
                </a>
              )}
            </div>
          )}

          {/* Status pill overlay */}
          <div className={`dp-status-pill ${data.isPresent ? 'present' : 'missing'}`}>
            {data.isPresent
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> متوفر بالملف</>
              : <><XCircle className="w-3.5 h-3.5" /> وثيقة ناقصة</>}
          </div>
        </div>

        {/* ══ SLOT 2 — Header ══ */}
        <header className="dp-header">
          <div className="dp-header-row">
            <h2 className="dp-title" dir="rtl">{data.titleAr}</h2>
            <button className="dp-close" onClick={onClose} aria-label="إغلاق">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="dp-badges">
            <span className="dp-badge dp-badge-mandatory">إلزامي</span>
            {data.legalizationNeeded && (
              <span className="dp-badge dp-badge-legalize">
                <Stamp className="w-3 h-3" />يلزم تصحيح الإمضاء
              </span>
            )}
            {data.isLegalized && (
              <span className="dp-badge dp-badge-legalized">
                <CheckCircle2 className="w-3 h-3" />تم التصحيح
              </span>
            )}
          </div>
        </header>

        {/* ══ SLOT 3 — Body ══ */}
        <div className="dp-body" dir="rtl">
          <p className="dp-desc">{data.descAr}</p>
          {data.notes && (
            <div className="dp-notes">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{data.notes}</span>
            </div>
          )}
        </div>

        {/* ══ SLOT 4 — Metadata row ══ */}
        <div className="dp-meta" dir="rtl">
          {data.fileName && (
            <div className="dp-meta-row">
              <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="dp-meta-label">الملف الرقمي:</span>
              <span className="dp-meta-value" style={{ fontFamily: 'monospace' }}>{data.fileName}</span>
            </div>
          )}
          {data.date && (
            <div className="dp-meta-row">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="dp-meta-label">تاريخ الإرفاق:</span>
              <span className="dp-meta-value">{data.date}</span>
            </div>
          )}
          {!data.fileName && !data.date && (
            <div className="dp-meta-row" style={{ color: '#cbd5e1' }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span style={{ fontSize: 11 }}>لم يُرفق أي ملف رقمي بعد لهذه الوثيقة</span>
            </div>
          )}
        </div>

        {/* ══ SLOT 5 — Footer  (margin-top:auto on .dp-footer pushes it down in equal-height grids) ══ */}
        <footer className="dp-footer">
          {data.fileUrl ? (
            <>
              <a
                href={data.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="dp-action dp-action-primary"
              >
                <ZoomIn className="w-4 h-4" />
                معاينة الملف الكامل
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
              <a
                href={data.fileUrl}
                download={data.fileName}
                className="dp-action dp-action-secondary"
              >
                <Download className="w-4 h-4" />
                تحميل
              </a>
            </>
          ) : (
            <span className="dp-no-file">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              لا يوجد ملف مرفق للمعاينة
            </span>
          )}

          <button onClick={onClose} className="dp-action dp-action-ghost">
            <X className="w-4 h-4" />
            إغلاق
          </button>
        </footer>

      </article>
    </div>
  );
};
