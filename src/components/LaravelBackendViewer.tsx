import React, { useState } from 'react';
import { 
  Server, 
  Copy, 
  Check, 
  Terminal, 
  FileCode, 
  Database, 
  Layers, 
  ExternalLink,
  BookOpen,
  Code2,
  CheckCircle2,
  Download
} from 'lucide-react';

export const LaravelBackendViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('routes');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const files: Record<string, { title: string; path: string; category: string; icon: any; code: string }> = {
    routes: {
      title: 'Routes API (مسارات الـ REST API)',
      path: 'routes/api.php',
      category: 'Routing',
      icon: Terminal,
      code: `<?php

use App\Http\Controllers\Api\\AssignmentController;
use App\Http\Controllers\Api\\DocumentController;
use Illuminate\\Support\\Facades\\Route;

/*
|--------------------------------------------------------------------------
| API Routes - AREF Oriental Housing Management System (Note 40)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // إدارة طلبات الإسناد (Assignments)
    Route::get('/assignments', [AssignmentController::class, 'index']);
    Route::post('/assignments', [AssignmentController::class, 'store']);
    Route::get('/assignments/{id}', [AssignmentController::class, 'show']);
    Route::patch('/assignments/{id}/status', [AssignmentController::class, 'updateStatus']);

    // توليد الوثائق الرسمية والطباعة (PDF Generation)
    Route::get('/assignments/{id}/documents/approval-letter', [DocumentController::class, 'generateApprovalLetter']);
    Route::get('/assignments/{id}/documents/pv-possession', [DocumentController::class, 'generatePvPossession']);

});`
    },
    migration: {
      title: 'Database Migration (جداول قاعدة البيانات)',
      path: 'database/migrations/2026_01_01_000001_create_housing_tables.php',
      category: 'Database',
      icon: Database,
      code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. المديريات الإقليمية (Directions Provinciales)
        Schema::create('directions_provinciales', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // DP_OUJDA, DP_BERKANE, etc.
            $table->string('name_ar');
            $table->string('name_fr');
            $table->timestamps();
        });

        // 2. الموظفون / المترشحون (Employees)
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('ppr')->unique(); // رقم التأجير
            $table->string('cin')->unique(); // رقم البطاقة الوطنية
            $table->string('full_name_ar');
            $table->string('full_name_fr');
            $table->string('current_job'); // الإطار والصفة
            $table->string('grade');
            $table->string('scale')->nullable(); // السلم
            $table->string('echelon')->nullable(); // الرتبة
            $table->foreignId('direction_provinciale_id')->constrained('directions_provinciales');
            $table->string('current_etablissement'); // مقر العمل الحالي
            $table->string('commune')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->date('birth_date')->nullable();
            $table->date('recruitment_date')->nullable(); // تاريخ التوظيف
            $table->string('marital_status')->default('marie'); // marie, celibataire
            $table->integer('children_count')->default(0);
            $table->boolean('spouse_is_civil_servant')->default(false);
            $table->timestamps();
        });

        // 3. السكنيات الوظيفية والإدارية (Lodgings)
        Schema::create('lodgings', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('direction_provinciale_id')->constrained('directions_provinciales');
            $table->string('etablissement_name');
            $table->string('address');
            $table->enum('type', ['fonction', 'necessite_service', 'administratif']);
            $table->string('category')->default('villa');
            $table->string('occupancy_status')->default('vacant');
            $table->integer('rooms_count')->default(3);
            $table->timestamps();
        });

        // 4. طلبات وقرارات الإسناد (Assignments)
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('lodging_id')->constrained('lodgings');
            $table->enum('status', ['draft', 'submitted', 'dp_validated', 'aref_pv_published', 'approved', 'rejected'])->default('submitted');
            $table->integer('seniority_general_points')->default(0);
            $table->integer('seniority_etablissement_points')->default(0);
            $table->integer('grade_points')->default(0);
            $table->integer('marital_points')->default(0);
            $table->integer('total_score')->default(0);
            $table->string('incoming_mail_num')->nullable();
            $table->date('incoming_mail_date')->nullable();
            $table->string('decision_number')->nullable();
            $table->date('decision_date')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('lodgings');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('directions_provinciales');
    }
};`
    },
    controller: {
      title: 'AssignmentController (متحكم طلبات الإسناد)',
      path: 'app/Http/Controllers/Api/AssignmentController.php',
      category: 'Controllers',
      icon: Layers,
      code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Assignment;
use App\\Models\\Employee;
use App\\Services\\Note40ScoreCalculator;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;

class AssignmentController extends Controller
{
    protected Note40ScoreCalculator $calculator;

    public function __construct(Note40ScoreCalculator $calculator)
    {
        $this->calculator = $calculator;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Assignment::with(['employee.directionProvinciale', 'lodging.directionProvinciale']);

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'lodging_id' => 'required|exists:lodgings,id',
            'seniority_etablissement_years' => 'integer|min:0',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $scores = $this->calculator->calculate($employee, $validated['seniority_etablissement_years'] ?? 0);

        $assignment = Assignment::create([
            'reference_number' => 'DOS-' . date('Y') . '-' . strtoupper(substr(uniqid(), -5)),
            'employee_id' => $employee->id,
            'lodging_id' => $validated['lodging_id'],
            'status' => 'submitted',
            'seniority_general_points' => $scores['seniority_general_points'],
            'seniority_etablissement_points' => $scores['seniority_etablissement_points'],
            'grade_points' => $scores['grade_points'],
            'marital_points' => $scores['family_points'],
            'total_score' => $scores['total_score'],
        ]);

        return response()->json(['message' => 'تم إنشاء طلب الاستفادة بنجاح', 'data' => $assignment], 201);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:submitted,dp_validated,aref_pv_published,approved,rejected',
            'incoming_mail_num' => 'nullable|string',
            'incoming_mail_date' => 'nullable|date',
            'decision_number' => 'nullable|string',
            'decision_date' => 'nullable|date',
        ]);

        $assignment = Assignment::findOrFail($id);
        $assignment->update($validated);

        if ($validated['status'] === 'approved') {
            $assignment->lodging->update(['occupancy_status' => 'occupied']);
        }

        return response()->json(['message' => 'تم تحديث وضعية الملف بنجاح', 'data' => $assignment]);
    }
}`
    },
    calculator: {
      title: 'Note40ScoreCalculator (خدمة احتساب شبكة التنقيط)',
      path: 'app/Services/Note40ScoreCalculator.php',
      category: 'Services',
      icon: FileCode,
      code: `<?php

namespace App\\Services;

use App\\Models\\Employee;

class Note40ScoreCalculator
{
    /**
     * احتساب مجموع النقط وفق المعايير السبعة الرسمية للمذكرة الوزارية رقم 40
     */
    public function calculate(Employee $employee): array
    {
        // 1. الإطار (حسب السلم الإداري)
        $echelle = (int) $employee->echelle;
        $scalePoints = ($echelle >= 12 || $echelle === 99) ? 3 : ($echelle === 11 ? 2 : 1);

        // 2. الأقدمية العامة (خمسة أشطر)
        $yearsGeneral = (int) $employee->anciennete_generale;
        $seniorityGeneralPoints = match (true) {
            $yearsGeneral >= 21 => 5,
            $yearsGeneral >= 16 => 4,
            $yearsGeneral >= 11 => 3,
            $yearsGeneral >= 6  => 2,
            $yearsGeneral >= 1  => 1,
            default => 0,
        };

        // 3. الأقدمية بنفس المدينة (شطران)
        $yearsLocal = (int) $employee->anciennete_etablissement;
        $localityPoints = $yearsLocal >= 6 ? 2 : ($yearsLocal >= 2 ? 1 : 0);

        // 4. التحملات العائلية (نقطة عن كل طفل في حدود 3 + نقطتان عن الزوج غير العامل)
        $childrenPoints = min((int) $employee->children_count, 3);
        $spousePoints = ($employee->marital_status === 'marie' && !$employee->conjoint_fonctionnaire) ? 2 : 0;

        // 5. المسؤولية (رئيس قسم = 3، رئيس مصلحة = 2)
        $responsibilityPoints = match ($employee->current_job) {
            'مدير ثانوية تأهيلية', 'مدير ثانوية إعدادية', 'مدير مدرسة ابتدائية' => 3,
            'ناظر الدروس', 'رئيس أشغال', 'حارس عام للخارجية', 'حارس عام للداخلية',
            'مسير المصالح المادية والمالية (مقتصد)', 'متصرف تربوي' => 2,
            default => 0,
        };

        // 6. المردودية (جيد جدا = 3، جيد = 2، مستحسن = 1، دون المستحسن = 0)
        $performancePoints = match ($employee->merdoudia) {
            'excellent' => 3,
            'good' => 2,
            'satisfactory' => 1,
            default => 0,
        };

        // 7. الوسط القروي (معلمة غير متزوجة = 3، مدرس بفرعية = 2)
        $ruralPoints = 0;
        if ($employee->milieu_rural && $employee->genre === 'female' && $employee->marital_status === 'celibataire') {
            $ruralPoints = 3;
        } elseif ($employee->franchise_rurale) {
            $ruralPoints = 2;
        }

        $totalScore = $scalePoints + $seniorityGeneralPoints + $localityPoints
            + $childrenPoints + $spousePoints + $responsibilityPoints
            + $performancePoints + $ruralPoints;

        // عند التعادل: تُرجَّح الأقدمية العامة، ثم يُلجأ إلى القرعة.
        return [
            'pts_echelle' => $scalePoints,
            'pts_anciennete_generale' => $seniorityGeneralPoints,
            'pts_anciennete_etablissement' => $localityPoints,
            'pts_enfants' => $childrenPoints,
            'pts_situation_familiale' => $spousePoints,
            'bonus_responsabilite' => $responsibilityPoints,
            'pts_merdoudia' => $performancePoints,
            'pts_milieu_rural' => $ruralPoints,
            'total_score' => $totalScore,
        ];
    }
}`
    },
    blade: {
      title: 'Blade PDF Template (قالب رسالة الموافقة مع الترويسة)',
      path: 'resources/views/pdf/lettre_accord_attribution.blade.php',
      category: 'Views (PDF)',
      icon: Code2,
      code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>الموافقة على إسناد سكن وظيفي</title>
    <style>
        @page { margin: 20px 40px; }
        body {
            font-family: 'amiri', 'DejaVu Sans', serif;
            direction: rtl;
            text-align: right;
            font-size: 15px;
            line-height: 1.8;
            color: #000;
        }
        .header-logo { text-align: center; width: 100%; margin-bottom: 25px; }
        .header-logo img { width: 85%; max-width: 750px; height: auto; }
        .recipient { text-align: center; font-weight: bold; font-size: 17px; margin: 20px 0; }
        .subject-box { margin: 20px 0; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; }
        .footer { position: absolute; bottom: 15px; left: 0; right: 0; text-align: center; border-top: 1.5px solid #000; font-size: 13px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header-logo">
        <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('images/header.png'))) }}" alt="En-tête AREF Oriental">
    </div>

    <div class="recipient">
        مديرة الأكاديمية<br>
        إلى السيد المدير الإقليمي<br>
        المديرية الإقليمية - {{ $assignment->employee->directionProvinciale->name_ar }}
    </div>

    <div class="subject-box">
        <p><strong><u>الموضوع:</u></strong> الموافقة على إسناد سكن وظيفي.</p>
        <p><strong><u>المرجع:</u></strong> إرساليتكم عدد {{ $assignment->incoming_mail_num }} بتاريخ {{ $assignment->incoming_mail_date }}<br>
        المذكرة الوزارية رقم 40 بتاريخ 10 ماي 2004</p>
    </div>

    <p style="text-align: center; font-weight: bold;">سلام تام بوجود مولانا الإمام</p>

    <div style="text-align: justify; margin-top: 20px;">
        <p>وبعد، فجوابا على إرساليتكم المشار إليها في المرجع أعلاه، والمتضمنة لطلب السيد(ة) <strong>{{ $assignment->employee->full_name_ar }}</strong> رقم التأجير <strong>{{ $assignment->employee->ppr }}</strong> في شأن الموافقة على إسناد السكن الوظيفي بـ <strong>{{ $assignment->lodging->address }}</strong>، يشرفني إخباركم أن الأكاديمية توافق على إسناد هذا السكن للمكلف بالأمر بصفته <strong>{{ $assignment->employee->current_job }}</strong>.</p>
    </div>

    <p style="text-align: center; font-weight: bold; margin-top: 40px;">وتقبلوا أزكى التحيات والسلام.</p>

    <div class="footer">
        قسم الشؤون الإدارية والمالية - الهاتف: 05-36-50-32-00 | الفاكس: 05-36-68-55-17
    </div>
</body>
</html>`
    }
  };

  const currentFile = files[activeFile];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl border border-red-900/40 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600/30 text-red-300 border border-red-500/30 flex items-center gap-1 font-mono">
                <Server className="w-3 h-3 text-red-400" />
                PHP 8.2+ · Laravel 11/12
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Note 40 Compliant
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              بنية الخادم الخلفي (Backend) في PHP Laravel
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              تم إعداد الهيكل الكامل لمشروع Laravel الجاهز للربط مع قاعدة البيانات وإصدار ملفات PDF الرسمية وفق معايير الأكاديمية الجهوية لجهة الشرق.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopy(currentFile.code, 'current')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {copied === 'current' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied === 'current' ? 'تم النسخ!' : 'نسخ الملف الحالي'}</span>
            </button>
          </div>
        </div>

        {/* Quick Command */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">أمر التثبيت السريع:</span>
          <code className="bg-slate-950/80 text-emerald-400 px-3 py-1 rounded-lg border border-slate-800">
            composer require barryvdh/laravel-dompdf && php artisan migrate
          </code>
        </div>
      </div>

      {/* Main Workspace: File Selector + Code Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: File Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            ملفات الـ Backend الجاهزة
          </div>
          <div className="space-y-1.5">
            {Object.entries(files).map(([key, f]) => {
              const Icon = f.icon;
              const isActive = activeFile === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveFile(key)}
                  className={`w-full text-right p-3 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-red-50 border-red-300 text-red-950 shadow-xs font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="truncate font-semibold">{f.title.split('(')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{f.path}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Guide Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-700 mt-4">
            <div className="font-bold flex items-center gap-1.5 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>محتويات الحزمة:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              <li>المسارات الكاملة في <code className="font-mono text-red-700">routes/api.php</code></li>
              <li>جدول الهجرة الكامل 4 جداول متصلة</li>
              <li>خوارزمية حساب النقط في <code className="font-mono text-red-700">Note40ScoreCalculator</code></li>
              <li>قالب Blade مع صورة الترويسة المرفقة</li>
            </ul>
          </div>
        </div>

        {/* Code Editor / Viewer */}
        <div className="lg:col-span-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          {/* File Header Bar */}
          <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300 font-mono" dir="ltr">
              <FileCode className="w-4 h-4 text-red-400" />
              <span className="font-bold text-white">{currentFile.path}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {currentFile.category}
              </span>
            </div>

            <button
              onClick={() => handleCopy(currentFile.code, currentFile.path)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied === currentFile.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span>{copied === currentFile.path ? 'تم النسخ!' : 'نسخ الكود'}</span>
            </button>
          </div>

          {/* Code Body */}
          <div className="p-4 overflow-x-auto flex-1 font-mono text-xs leading-relaxed text-slate-200" dir="ltr">
            <pre className="selection:bg-red-600 selection:text-white">
              <code>{currentFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
