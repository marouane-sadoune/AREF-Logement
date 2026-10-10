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
  ChevronLeft,
  ChevronRight,
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
  // For composite documents (e.g. الوضع العائلي = 3 sub-documents).
  // `name` is the display label, `fileName` the real stored file (extension
  // needed for image/PDF detection).
  files?: { name: string; url?: string; fileName?: string }[];
  initialIndex?: number;
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [fileIndex, setFileIndex] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => { setZoom(1); setFileIndex(data.initialIndex ?? 0); }, [data.id]);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Reversible exit: play the fade/scale-out first, unmount after it ends.
  // Escape is handled natively by <dialog> via the cancel event.
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 180);
  };

  // Composite documents (e.g. الوضع العائلي) carry several files: the viewer
  // shows them one at a time and the user switches with the arrows or the
  // buttons next to each file name.
  const files = data.files ?? [];
  const safeIndex = Math.min(fileIndex, Math.max(0, files.length - 1));
  const currentFile = files.length > 0 ? files[safeIndex] : undefined;
  const previewUrl = currentFile?.url ?? data.fileUrl;
  const previewName = currentFile?.fileName ?? currentFile?.name ?? data.fileName;

  const isImg = isImageFile(previewName);
  const isPdf = (previewName ?? '').toLowerCase().endsWith('.pdf');

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
  }, [isImg, previewUrl]);

  const goToFile = (next: number) => {
    if (files.length === 0) return;
    setFileIndex((next + files.length) % files.length);
    setZoom(1);
  };

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
    <dialog
      ref={dialogRef}
      onCancel={(e) => { e.preventDefault(); requestClose(); }}
      onClick={(e) => e.target === dialogRef.current && requestClose()}
      aria-label={`معاينة: ${data.titleAr}`}
      className={`dp-dialog${closing ? ' dp-closing' : ''}`}
    >
      <style>{`
        @keyframes dpFadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes dpFadeOut { from { opacity:1 } to { opacity:0 } }
        @keyframes dpCardIn  { from { transform: scale(.96); opacity:0 } to { transform: scale(1); opacity:1 } }
        @keyframes dpCardOut { from { transform: scale(1); opacity:1 } to { transform: scale(.96); opacity:0 } }
        @keyframes dpFileIn  { from { opacity:0; transform: scale(.99) } to { opacity:1; transform: scale(1) } }
        .dp-dialog {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
          margin: 0;
          padding: 1rem;
          border: 0;
          background: transparent;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .dp-dialog::backdrop {
          background: rgba(2,6,23,0.72);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          animation: dpFadeIn 0.18s ease;
        }
        .dp-dialog.dp-closing::backdrop { animation: dpFadeOut 0.18s ease forwards; }
        .dp-dialog.dp-closing .dp-card { animation: dpCardOut 0.18s ease forwards; }
        .dp-file-anim { animation: dpFileIn 0.18s ease; height: 100%; }
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
          animation: dpCardIn 0.22s cubic-bezier(0.34,1.56,0.64,1);
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
        .dp-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 999px;
          background: rgba(15,23,42,0.7);
          backdrop-filter: blur(8px);
          color: #e2e8f0;
          cursor: pointer;
          transition: background 0.12s;
          z-index: 2;
        }
        .dp-nav-btn:hover { background: rgba(5,150,105,0.85); }
        .dp-file-counter {
          position: absolute;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          font-weight: 700;
          font-family: monospace;
          color: #e2e8f0;
          background: rgba(15,23,42,0.7);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 999px;
          padding: 4px 12px;
          z-index: 2;
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
          background: rgba(5,150,105,0.85);
          color: #fff;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s;
        }
        .dp-open-link:hover { background: rgba(4,120,87,1); }
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
          background: linear-gradient(135deg, #10b981, #047857);
          color: #fff;
          box-shadow: 0 2px 8px rgba(16,185,129,0.35);
        }
        .dp-action-primary:hover { box-shadow: 0 4px 14px rgba(16,185,129,0.45); transform: translateY(-1px); }
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
          {previewUrl && isImg ? (
            <div
              key={`img-${safeIndex}`}
              ref={scrollRef}
              className="dp-media-scroll dp-file-anim"
              style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              <img
                src={previewUrl}
                alt={previewName ?? data.titleAr}
                draggable={false}
                style={{ width: `${zoom * 100}%`, maxWidth: zoom > 1 ? 'none' : '100%', margin: 'auto' }}
              />
            </div>
          ) : previewUrl && isPdf ? (
            <iframe key={`pdf-${safeIndex}`} className="dp-file-anim" src={previewUrl} title={data.titleAr} />
          ) : (
            <div key={`ph-${safeIndex}`} className="dp-media-placeholder dp-file-anim">
              <FileIcon name={previewName} />
              <span className="dp-file-type-badge">{fileTypeLabel(previewName)}</span>
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noreferrer" className="dp-open-link">
                  <Eye className="w-4 h-4" />
                  فتح الملف في نافذة جديدة
                </a>
              )}
            </div>
          )}

          {/* Arrows to switch between the attached files (RTL: next = left) */}
          {files.length > 1 && (
            <>
              <button
                className="dp-nav-btn"
                style={{ right: 12 }}
                onClick={() => goToFile(safeIndex - 1)}
                aria-label="الملف السابق"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                className="dp-nav-btn"
                style={{ left: 12 }}
                onClick={() => goToFile(safeIndex + 1)}
                aria-label="الملف التالي"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="dp-file-counter" dir="ltr">{safeIndex + 1} / {files.length}</span>
            </>
          )}

          {/* Zoom controls for images */}
          {previewUrl && isImg && (
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

          {/* Status pill overlay — reflects the file currently displayed */}
          <div className={`dp-status-pill ${(files.length > 0 ? !!currentFile?.url : data.isPresent) ? 'present' : 'missing'}`}>
            {(files.length > 0 ? !!currentFile?.url : data.isPresent)
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> متوفر بالملف</>
              : <><XCircle className="w-3.5 h-3.5" /> وثيقة لم تُرفق بعد</>}
          </div>
        </div>

        {/* ══ SLOT 2 — Header ══ */}
        <header className="dp-header">
          <div className="dp-header-row">
            <h2 className="dp-title" dir="rtl">{data.titleAr}</h2>
            <button className="dp-close" onClick={requestClose} aria-label="إغلاق">
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
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1"
                  style={i === safeIndex ? { background: '#ecfdf5', outline: '1px solid #a7f3d0' } : undefined}
                >
                  <button
                    type="button"
                    onClick={() => goToFile(i)}
                    className="dp-meta-value truncate text-right cursor-pointer hover:text-emerald-700"
                    style={{ fontFamily: 'monospace', border: 0, background: 'transparent', fontSize: 11.5 }}
                    title="عرض هذا الملف في المعاينة"
                  >
                    📄 {f.name}
                  </button>
                  <span className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => goToFile(i)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer"
                      style={i === safeIndex
                        ? { background: '#059669', color: '#fff' }
                        : { background: '#e2e8f0', color: '#334155' }}
                    >
                      {i === safeIndex ? 'معروض' : 'معاينة'}
                    </button>
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-[11px]">
                        فتح
                      </a>
                    )}
                  </span>
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
          {previewUrl ? (
            <a
              href={previewUrl}
              download={previewName}
              className="dp-action dp-action-primary"
            >
              <Download className="w-4 h-4" />
              تحميل الملف
            </a>
          ) : (data.files && data.files.length > 0) ? (
            <span className="dp-no-file" style={{ color: '#059669' }}>
              استخدم الأسهم أو الأزرار للتنقل بين وثائق الملف
            </span>
          ) : (
            <span className="dp-no-file">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              لا يوجد ملف مرفق للمعاينة
            </span>
          )}

          <button onClick={requestClose} className="dp-action dp-action-ghost">
            <X className="w-4 h-4" />
            إغلاق
          </button>
        </footer>

      </article>
    </dialog>
  );
};
