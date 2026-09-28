# Laravel Backend - نظام تدبير السكنيات الوظيفية والإدارية (AREF Oriental)

هذا الدليل يوضح بنية الخادم الخلفي (Backend) المبني بواسطة **PHP Laravel 11 / 12** المتوافق تماماً مع **المذكرة الوزارية رقم 40**.

---

## 🚀 متطلبات التشغيل (Requirements)
- PHP >= 8.2
- Composer
- MySQL / MariaDB أو PostgreSQL
- مكتبة توليد ملفات PDF: `barryvdh/laravel-dompdf`

---

## 📦 التثبيت السريع (Quick Setup)

```bash
# 1. تثبيت الحزم المطلوبة
composer require barryvdh/laravel-dompdf

# 2. إعداد قاعدة البيانات في ملف .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=logements_aref
DB_USERNAME=root
DB_PASSWORD=

# 3. تشغيل ملفات التهجير (Migrations)
php artisan migrate

# 4. تشغيل خادم التطوير
php artisan serve
```

---

## 🗂️ هيكل الملفات المُنشأة:
- `routes/api.php`: المسارات الكاملة لواجهات البرمجة (REST API).
- `app/Models/`: النماذج والعلاقات (`Employee`, `Lodging`, `Assignment`, `DirectionProvinciale`).
- `app/Http/Controllers/Api/`: متحكمات إدارة الطلبات وتوليد وثائق PDF الرسمية.
- `app/Services/Note40ScoreCalculator.php`: خدمة احتساب شبكة التنقيط بدقة متناهية وفق المذكرة 40.
- `resources/views/pdf/`: قوالب Blade الرسمية الخاصة بالرسائل والمحاضر المعتمدة بالأكاديمية.
