import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  FileText,
  FileImage,
  File,
  Download,
  Stamp,
  CheckCircle2,
  XCircle,
  Calendar,
  Paperclip,
  AlertTriangle,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
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
  // For composite documents (e.g. الوضع العائلي = 3 sub-documents)
  files?: { name: string; url?: string }[];
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { setZoom(1); }, [data.id]);

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
  const isPdf = (data.fileName ?? '').toLowerCase().endsWith('.pdf');

  // Plain wheel = zoom (non-passive so the page never scrolls behind the card).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isImg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(5, Math.max(0.5, +(z + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isImg, data.fileUrl]);

  const handleDragStart = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragOrigin.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    const origin = dragOrigin.current;
    if (!el || !origin) return;
    el.scrollLeft = origin.sl - (e.clientX - origin.x);
    el.scrollTop = origin.st - (e.clientY - origin.y);
  };

  const handleDragEnd = () => {
    dragOrigin.current = null;
    setIsDragging(false);
  };

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
          max-width: 980px;
          max-height: 94vh;
          box-shadow: 0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08);
          animation: dpSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .dp-media {
          position: relative;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%);
          height: 62vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .dp-media-scroll {
          width: 100%;
          height: 100%;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dp-media img {
          object-fit: contain;
          display: block;
        }
        .dp-media iframe {
          width: 100%;
          height: 100%;
          border: 0;
          background: #fff;
        }
        .dp-zoom-bar {
          position: absolute;
          bottom: 12px;
          left: 12px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          padding: 4px;
          background: rgba(15,23,42,0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 999px;
        }
        .dp-zoom-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: #e2e8f0;
          cursor: pointer;
          transition: background 0.12s;
        }
        .dp-zoom-btn:hover { background: rgba(255,255,255,0.12); }
        .dp-zoom-btn:disabled { color: #475569; cursor: not-allowed; }
        .dp-zoom-level {
          min-width: 44px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #cbd5e1;
          font-family: monospace;
        }
        .dp-hint-pill {
          position: absolute;
          top: 12px;
          left: 12px;
          max-width: 60%;
          font-size: 10.5px;
          font-weight: 600;
          color: #cbd5e1;
          background: rgba(15,23,42,0.65);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 5px 12px;
          pointer-events: none;
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

        {/* ══ SLOT 1 — Media (inline preview with direct zoom) ══ */}
        <div className="dp-media">
          {data.fileUrl && isImg ? (
            <div
              ref={scrollRef}
              className="dp-media-scroll"
              style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              <img
                src={data.fileUrl}
                alt={data.titleAr}
                draggable={false}
                style={{ width: `${zoom * 100}%`, maxWidth: zoom > 1 ? 'none' : '100%', margin: 'auto' }}
              />
            </div>
          ) : data.fileUrl && isPdf ? (
            <iframe src={data.fileUrl} title={data.titleAr} />
          ) : (
            <div className="dp-media-placeholder">
              <FileIcon name={data.fileName} />
              <span className="dp-file-type-badge">{fileTypeLabel(data.fileName)}</span>
              {data.fileUrl && (
                <a href={data.fileUrl} target="_blank" rel="noreferrer" className="dp-open-link">
                  <Eye className="w-4 h-4" />
                  فتح الملف في نافذة جديدة
                </a>
              )}
            </div>
          )}

          {/* Zoom controls for images */}
          {data.fileUrl && isImg && (
            <>
              <div className="dp-zoom-bar">
                <button
                  className="dp-zoom-btn"
                  onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  disabled={zoom <= 0.5}
                  aria-label="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="dp-zoom-level">{Math.round(zoom * 100)}%</span>
                <button
                  className="dp-zoom-btn"
                  onClick={() => setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))}
                  disabled={zoom >= 5}
                  aria-label="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  className="dp-zoom-btn"
                  onClick={() => setZoom(1)}
                  disabled={zoom === 1}
                  aria-label="إعادة الحجم"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
              <div className="dp-hint-pill" dir="rtl">
                عجلة الفأرة: تكبير/تصغير · اسحب الصورة بالزر الأيسر للتحريك في كل الاتجاهات
              </div>
            </>
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
          {data.files && data.files.length > 0 && (
            <div className="dp-meta-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
              {data.files.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="dp-meta-value truncate" style={{ fontFamily: 'monospace' }}>📄 {f.name}</span>
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold">
                      معاينة
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {!data.fileName && !data.date && !(data.files && data.files.length) && (
            <div className="dp-meta-row" style={{ color: '#cbd5e1' }}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span style={{ fontSize: 11 }}>لم يُرفق أي ملف رقمي بعد لهذه الوثيقة</span>
            </div>
          )}
        </div>

        {/* ══ SLOT 5 — Footer  (margin-top:auto on .dp-footer pushes it down in equal-height grids) ══ */}
        <footer className="dp-footer">
          {data.fileUrl ? (
            <a
              href={data.fileUrl}
              download={data.fileName}
              className="dp-action dp-action-primary"
            >
              <Download className="w-4 h-4" />
              تحميل الملف
            </a>
          ) : (data.files && data.files.length > 0) ? (
            <span className="dp-no-file" style={{ color: '#059669' }}>
              ✓ {data.files.length} وثائق مرفقة — استخدم روابط المعاينة أعلاه
            </span>
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
