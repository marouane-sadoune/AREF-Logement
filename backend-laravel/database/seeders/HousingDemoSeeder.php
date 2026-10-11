<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| بيانات تجريبية للعرض — ملف السكن الوظيفي (المذكرة 40)
|--------------------------------------------------------------------------
| 14 ملفاً موزعة على كل المسارات: مسودة، مودع، قيد التدقيق، محال للأكاديمية،
| مصادق عليه، مرفوض — منها ملفات مغلقة منذ أكثر من سنة تظهر في الأرشيف.
| النقاط محسوبة وفق شبكة المذكرة 40 المعتمدة في الواجهة.
*/

class HousingDemoSeeder extends Seeder
{
    private const DPS = [
        ['OUJ', 'المديرية الإقليمية بوجدة أنكاد', 'Direction Provinciale Oujda-Angad', 'وجدة'],
        ['BRK', 'المديرية الإقليمية ببركان', 'Direction Provinciale Berkane', 'بركان'],
        ['NAD', 'المديرية الإقليمية بالناظور', 'Direction Provinciale Nador', 'الناظور'],
        ['DRI', 'المديرية الإقليمية بالدريوش', 'Direction Provinciale Driouch', 'الدريوش'],
        ['TAO', 'المديرية الإقليمية بتاوريرت', 'Direction Provinciale Taourirt', 'تاوريرت'],
        ['GUE', 'المديرية الإقليمية بجرسيف', 'Direction Provinciale Guercif', 'جرسيف'],
        ['JER', 'المديرية الإقليمية بجرادة', 'Direction Provinciale Jerada', 'جرادة'],
        ['FIG', 'المديرية الإقليمية بفكيك', 'Direction Provinciale Figuig', 'فكيك'],
    ];

    private const DIRECTOR_GRADES = [
        'مدير ثانوية تأهيلية',
        'مدير ثانوية إعدادية',
        'مدير مدرسة ابتدائية',
    ];

    private const SERVICE_CHIEF_GRADES = [
        'ناظر الدروس',
        'رئيس أشغال',
        'حارس عام للخارجية',
        'حارس عام للداخلية',
        'مسير المصالح المادية والمالية (مقتصد)',
        'متصرف تربوي',
    ];

    public function run(): void
    {
        $this->clean();
        $this->seedDirections();

        $logements = $this->seedLogements();

        foreach ($this->dossiers() as $d) {
            $cand = $d['candidat'];
            $dp = self::DPS[$cand['dp']];

            DB::table('candidats')->insert([
                'ppr' => $cand['ppr'],
                'cin' => $cand['cin'],
                'gender' => $cand['gender'],
                'nom_ar' => $cand['nom_ar'],
                'nom_fr' => $cand['nom_fr'],
                'telephone' => $cand['tel'],
                'email' => null,
                'cadre' => $cand['cadre'],
                'echelle' => $cand['echelle'],
                'echelon' => $cand['echelon'],
                'anciennete_generale' => $cand['anc_gen'],
                'anciennete_etablissement' => $cand['anc_etab'],
                'date_installation' => $cand['date_install'],
                'etablissement_actuel' => $cand['etab'],
                'type_etablissement' => $cand['type_etab'],
                'commune' => $cand['commune'],
                'direction_provinciale' => $dp[1],
                'aref' => 'الأكاديمية الجهوية للتربية والتكوين - الشرق',
                'situation_familiale' => $cand['situation'],
                'nom_conjoint' => $cand['conjoint'],
                'conjoint_fonctionnaire' => $cand['conjoint_fonct'],
                'administration_conjoint' => $cand['conjoint_fonct'] ? 'وزارة التربية الوطنية' : null,
                'ppr_conjoint' => $cand['conjoint_fonct'] ? 'PPR-CONJ-' . substr($cand['ppr'], -4) : null,
                'nombre_enfants' => $cand['enfants'],
                'merdoudia' => $cand['merdoudia'],
                'milieu_rural' => $cand['rural'],
                'franchise_rurale' => $cand['branche'],
            ]);

            $bareme = $this->computeBareme($cand);

            $registreId = null;
            if (isset($d['logement'])) {
                $registreId = $logements[$d['logement']]['id'];
                DB::table('registre_logements')
                    ->where('id', $registreId)
                    ->update([
                        'statut' => 'occupe',
                        'occupant_ppr' => $cand['ppr'],
                        'date_attribution' => $d['decision_date'],
                        'updated_at' => now(),
                    ]);
            }

            DB::table('demandes_logement')->insert([
                'numero_dossier' => $d['numero'],
                'candidat_ppr' => $cand['ppr'],
                'registre_logement_id' => $registreId,
                'type_logement' => $d['type_logement'],
                'etablissement_cible' => $d['etablissement_cible'],
                'categorie_logement' => $d['categorie'],
                'adresse_logement' => $registreId ? $logements[$d['logement']]['adresse'] : null,
                'numero_logement' => $registreId ? $logements[$d['logement']]['numero'] : null,
                'statut_logement' => $registreId ? 'occupe_a_evacuer' : 'vacant',
                'statut_dossier' => $d['status'],
                'date_creation' => $d['creation_date'],
                'total_bareme' => $bareme['total'],
                'reasons' => $d['status'] === 'rejected' ? $d['reasons'] : null,
                'numero_bordereau_dp' => $d['bordereau'],
                'date_transmission_aref' => $d['transmission_date'],
                'numero_decision_aref' => $d['decision_number'],
                'date_commission_aref' => $d['decision_date'],
            ]);

            DB::table('baremes_detail')->insert(
                ['numero_dossier' => $d['numero'], ...$bareme['rows'], 'total_points' => $bareme['total']]
            );

            DB::table('documents_fournis')->insert([
                'numero_dossier' => $d['numero'],
                'demande_manuscrite' => $d['docs'][0],
                'copie_cin' => $d['docs'][1],
                'attestation_travail' => $d['docs'][2],
                'situation_familiale' => $d['docs'][3],
                'engagement_honneur' => $d['docs'][4],
                'pv_installation' => $d['docs'][5],
                'date_verification_dp' => $d['docs'][3] ? $d['audit_date'] : null,
            ]);

            foreach ($d['history'] as $h) {
                DB::table('audit_historique')->insert([
                    'numero_dossier' => $d['numero'],
                    'date_action' => $h[0],
                    'acteur' => $h[1],
                    'decision' => $h[2],
                    'commentaire' => $h[3],
                ]);
            }
        }

        $this->seedEvictions();
    }

    private function clean(): void
    {
        $numbers = [];
        $pprs = [];
        for ($i = 1; $i <= 14; $i++) {
            $numbers[] = sprintf('DOS-DEMO-%04d', $i);
            $pprs[] = sprintf('PPR-DEMO-%04d', $i);
        }

        DB::table('eviction_procedures')->whereIn('numero_dossier', $numbers)->delete();
        DB::table('audit_historique')->whereIn('numero_dossier', $numbers)->delete();
        DB::table('documents_fournis')->whereIn('numero_dossier', $numbers)->delete();
        DB::table('baremes_detail')->whereIn('numero_dossier', $numbers)->delete();
        DB::table('demandes_logement')->whereIn('numero_dossier', $numbers)->delete();
        DB::table('candidats')->whereIn('ppr', $pprs)->delete();
        DB::table('registre_logements')->where('numero_logement', 'like', 'LOG-DEMO-%')->delete();
        DB::table('directions_provinciales')->delete();
    }

    private function seedDirections(): void
    {
        foreach (self::DPS as [$code, $ar, $fr, $chef]) {
            DB::table('directions_provinciales')->insert([
                'code' => $code,
                'nom_ar' => $ar,
                'nom_fr' => $fr,
                'chef_lieu' => $chef,
            ]);
        }
    }

    /** @return array<string, array{id:int, numero:string, adresse:string}> */
    private function seedLogements(): array
    {
        $rows = [
            ['LOG-DEMO-0001', 'الثانوية التأهيلية محمد الخامس', 0, 'fonction', 'سكن إداري', 'حي المسيرة، شارع محمد الخامس، وجدة', 4, 6, 'bon'],
            ['LOG-DEMO-0002', 'الثانوية الإعدادية ابن سينا', 0, 'fonction', 'سكن تربوي', 'تجزئة النور، وجدة', 3, 4, 'moyen'],
            ['LOG-DEMO-0003', 'مدرسة الفارابي الابتدائية', 1, 'administratif', 'سكن إداري', 'وسط المدينة، بركان', 4, 5, 'bon'],
            ['LOG-DEMO-0004', 'الثانوية التأهيلية الريف', 2, 'fonction', 'سكن تربوي', 'طريق أزلا، الناظور', 3, 4, 'bon'],
            ['LOG-DEMO-0005', 'المديرية الإقليمية بالدريوش', 3, 'administratif', 'سكن إداري', 'شارع محمد الخامس، الدريوش', 5, 7, 'moyen'],
            ['LOG-DEMO-0006', 'الثانوية الإعدادية ابن رشد', 4, 'fonction', 'سكن تربوي', 'حي النهضة، تاوريرت', 3, 4, 'bon'],
            ['LOG-DEMO-0007', 'مدرسة ابن بطوطة الابتدائية', 5, 'administratif', 'سكن إداري', 'حي السلام، جرسيف', 4, 6, 'mauvais'],
            ['LOG-DEMO-0008', 'الثانوية التأهيلية جرادة', 6, 'fonction', 'سكن تربوي', 'شارع الاستقلال، جرادة', 3, 4, 'moyen'],
            ['LOG-DEMO-0009', 'المديرية الإقليمية بفكيك', 7, 'administratif', 'سكن إداري', 'وسط المدينة، فكيك', 4, 5, 'bon'],
            ['LOG-DEMO-0010', 'الثانوية الإعدادية العقاد', 1, 'fonction', 'سكن تربوي', 'تجزيرة الأندلس، بركان', 3, 4, 'bon'],
        ];

        $map = [];
        foreach ($rows as [$numero, $etab, $dpIdx, $type, $cat, $adresse, $pieces, $cap, $etat]) {
            DB::table('registre_logements')->insert([
                'numero_logement' => $numero,
                'etablissement' => $etab,
                'direction_provinciale' => self::DPS[$dpIdx][1],
                'type_logement' => $type,
                'categorie' => $cat,
                'adresse' => $adresse,
                'nombre_pieces' => $pieces,
                'capacite_personnes' => $cap,
                'statut' => 'vacant',
                'etat_batiment' => $etat,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $map[$numero] = [
                'id' => (int) DB::table('registre_logements')->where('numero_logement', $numero)->value('id'),
                'numero' => $numero,
                'adresse' => $adresse,
            ];
        }

        return $map;
    }

    private function computeBareme(array $c): array
    {
        $scalePts = ($c['echelle'] >= 10 || $c['echelle'] === 99) ? 3 : (($c['echelle'] >= 7) ? 2 : 1);
        $gen = $c['anc_gen'];
        $senGen = $gen >= 21 ? 5 : ($gen >= 16 ? 4 : ($gen >= 11 ? 3 : ($gen >= 6 ? 2 : ($gen >= 1 ? 1 : 0))));
        $etab = $c['anc_etab'];
        $senEtab = $etab >= 6 ? 2 : ($etab >= 2 ? 1 : 0);
        $marital = ($c['situation'] === 'marie' && !$c['conjoint_fonct']) ? 2 : 0;
        $children = min($c['enfants'], 3);
        $resp = in_array($c['cadre'], self::DIRECTOR_GRADES, true) ? 3
            : (in_array($c['cadre'], self::SERVICE_CHIEF_GRADES, true) ? 2 : 0);
        $perf = ['excellent' => 3, 'good' => 2, 'satisfactory' => 1, 'below' => 0][$c['merdoudia']];
        $rural = ($c['rural'] && $c['gender'] === 'female' && $c['situation'] === 'celibataire')
            ? 3
            : ($c['branche'] ? 2 : 0);

        return [
            'total' => $scalePts + $senGen + $senEtab + $marital + $children + $resp + $perf + $rural,
            'rows' => [
                'pts_echelle' => $scalePts,
                'pts_anciennete_generale' => $senGen,
                'pts_anciennete_etablissement' => $senEtab,
                'pts_situation_familiale' => $marital,
                'pts_enfants' => $children,
                'bonus_responsabilite' => $resp,
                'pts_merdoudia' => $perf,
                'pts_milieu_rural' => $rural,
            ],
        ];
    }

    /**
     * كل ملف: المترشح + المسار + الوثائق + السجل التدقيقي.
     * الوثائق: [طلب خطي، نسخة CIN، شهادة العمل، الوضع العائلي، التعهد، محضر التسليم]
     */
    private function dossiers(): array
    {
        $c = fn(array $o) => array_merge([
            'ppr' => '', 'cin' => '', 'gender' => 'male', 'nom_ar' => '', 'nom_fr' => '',
            'tel' => '', 'cadre' => 'أستاذ التعليم الثانوي التأهيلي', 'echelle' => 11, 'echelon' => 7,
            'anc_gen' => 12, 'anc_etab' => 5, 'date_install' => '2018-09-01',
            'etab' => '', 'type_etab' => 'ثانوي تأهيلي', 'commune' => '', 'dp' => 0,
            'situation' => 'marie', 'conjoint' => null, 'conjoint_fonct' => false, 'enfants' => 2,
            'merdoudia' => 'good', 'rural' => false, 'branche' => false,
        ], $o);

        return [
            [
                'numero' => 'DOS-DEMO-0001', 'status' => 'under_review_dp',
                'type_logement' => 'fonction', 'etablissement_cible' => 'الثانوية التأهيلية محمد الخامس',
                'categorie' => 'سكن إداري', 'creation_date' => '2026-09-20',
                'bordereau' => null, 'transmission_date' => null,
                'decision_number' => null, 'decision_date' => null, 'audit_date' => '2026-09-28',
                'reasons' => null, 'docs' => [true, true, true, true, true, false],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0001', 'cin' => 'E452118',
                    'nom_ar' => 'محمد المصباحي', 'nom_fr' => 'Mohamed El Msabahi',
                    'tel' => '0661223344', 'echelle' => 11, 'echelon' => 9,
                    'anc_gen' => 18, 'anc_etab' => 7, 'date_install' => '2019-01-15',
                    'etab' => 'الثانوية التأهيلية محمد الخامس', 'commune' => 'وجدة',
                    'cadre' => 'مدير ثانوية تأهيلية', 'situation' => 'marie',
                    'conjoint' => 'خديجة العلوي', 'enfants' => 3, 'merdoudia' => 'excellent',
                ]),
                'history' => [
                    ['2026-09-20 09:00:00', 'محمد المصباحي', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2026-09-28 11:30:00', 'ممثل المديرية - وجدة أنكاد', 'under_review_dp', 'تدقيق محلي: الوثائق مدروسة'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0002', 'status' => 'transmitted_aref',
                'type_logement' => 'fonction', 'etablissement_cible' => 'الثانوية التأهيلية الريف',
                'categorie' => 'سكن تربوي', 'creation_date' => '2026-08-12',
                'bordereau' => 'BORD/DP-NAD/2026/014', 'transmission_date' => '2026-09-05',
                'decision_number' => null, 'decision_date' => null, 'audit_date' => '2026-09-03',
                'reasons' => null, 'docs' => [true, true, true, true, true, true],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0002', 'cin' => 'TA771203', 'gender' => 'female',
                    'nom_ar' => 'فاطمة الزهراء بنعيسى', 'nom_fr' => 'Fatima Zahra Benaissa',
                    'tel' => '0677889900', 'echelle' => 10, 'echelon' => 6,
                    'anc_gen' => 14, 'anc_etab' => 8, 'date_install' => '2018-10-01',
                    'etab' => 'الثانوية التأهيلية الريف', 'type_etab' => 'ثانوي تأهيلي',
                    'commune' => 'الناظور', 'dp' => 2, 'cadre' => 'أستاذ التعليم الثانوي التأهيلي',
                    'situation' => 'celibataire', 'conjoint' => null, 'enfants' => 0,
                    'merdoudia' => 'excellent', 'rural' => true,
                ]),
                'history' => [
                    ['2026-08-12 10:00:00', 'فاطمة الزهراء بنعيسى', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2026-09-03 15:20:00', 'ممثل المديرية - الناظور', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                    ['2026-09-05 09:45:00', 'ممثل المديرية - الناظور', 'transmitted_aref', 'إحالة الملف على الأكاديمية'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0003', 'status' => 'approved',
                'type_logement' => 'administratif', 'etablissement_cible' => 'مدرسة الفارابي الابتدائية',
                'categorie' => 'سكن إداري', 'creation_date' => '2026-05-10',
                'bordereau' => 'BORD/DP-BRK/2026/007', 'transmission_date' => '2026-06-01',
                'decision_number' => 'DEC/AREF/2026/031', 'decision_date' => '2026-06-20',
                'audit_date' => '2026-05-28', 'reasons' => null,
                'docs' => [true, true, true, true, true, true],
                'logement' => 'LOG-DEMO-0003',
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0003', 'cin' => 'E334521',
                    'nom_ar' => 'عبد الحق الودغيري', 'nom_fr' => 'Abdelhak Oudghiri',
                    'tel' => '0655443322', 'echelle' => 11, 'echelon' => 8,
                    'anc_gen' => 22, 'anc_etab' => 10, 'date_install' => '2016-09-01',
                    'etab' => 'مدرسة الفارابي الابتدائية', 'type_etab' => 'ابتدائي',
                    'commune' => 'بركان', 'dp' => 1, 'cadre' => 'مدير مدرسة ابتدائية',
                    'situation' => 'marie', 'conjoint' => 'سميرة بوعزة', 'enfants' => 3,
                    'merdoudia' => 'good',
                ]),
                'history' => [
                    ['2026-05-10 08:30:00', 'عبد الحق الودغيري', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2026-05-28 14:00:00', 'ممثل المديرية - بركان', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                    ['2026-06-01 10:15:00', 'ممثل المديرية - بركان', 'transmitted_aref', 'إحالة الملف على الأكاديمية'],
                    ['2026-06-20 11:00:00', 'لجنة الأكاديمية', 'approved', 'المصادقة على إسناد السكن الوظيفي'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0004', 'status' => 'approved',
                'type_logement' => 'fonction', 'etablissement_cible' => 'الثانوية الإعدادية ابن سينا',
                'categorie' => 'سكن تربوي', 'creation_date' => '2024-03-05',
                'bordereau' => 'BORD/DP-OUJ/2024/021', 'transmission_date' => '2024-04-10',
                'decision_number' => 'DEC/AREF/2024/052', 'decision_date' => '2024-05-15',
                'audit_date' => '2024-04-02', 'reasons' => null,
                'docs' => [true, true, true, true, true, true],
                'logement' => 'LOG-DEMO-0002',
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0004', 'cin' => 'E221144',
                    'nom_ar' => 'مصطفى بوعبود', 'nom_fr' => 'Mustapha Bouaboud',
                    'tel' => '0661002030', 'echelle' => 10, 'echelon' => 7,
                    'anc_gen' => 25, 'anc_etab' => 12, 'date_install' => '2012-09-01',
                    'etab' => 'الثانوية الإعدادية ابن سينا', 'type_etab' => 'إعدادي',
                    'commune' => 'وجدة', 'cadre' => 'حارس عام للداخلية',
                    'situation' => 'marie', 'conjoint' => 'نجاة الفاسي', 'enfants' => 4,
                    'merdoudia' => 'satisfactory',
                ]),
                'history' => [
                    ['2024-03-05 09:00:00', 'مصطفى بوعبود', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2024-04-02 10:30:00', 'ممثل المديرية - وجدة أنكاد', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                    ['2024-04-10 12:00:00', 'ممثل المديرية - وجدة أنكاد', 'transmitted_aref', 'إحالة الملف على الأكاديمية'],
                    ['2024-05-15 15:45:00', 'لجنة الأكاديمية', 'approved', 'المصادقة على إسناد السكن الوظيفي'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0005', 'status' => 'rejected',
                'type_logement' => 'fonction', 'etablissement_cible' => 'الثانوية الإعدادية ابن رشد',
                'categorie' => 'سكن تربوي', 'creation_date' => '2024-12-02',
                'bordereau' => 'BORD/DP-DRI/2024/009', 'transmission_date' => '2025-01-20',
                'decision_number' => 'DEC/AREF/2025/011', 'decision_date' => '2025-03-10',
                'audit_date' => '2025-01-15', 'reasons' => 'عدم التوفر على الأقدمية المطلوبة بالمؤسسة؛ الأولوية لمترشحين بنقط أعلى.',
                'docs' => [true, true, true, true, true, true],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0005', 'cin' => 'EB118877',
                    'nom_ar' => 'يوسف أمغار', 'nom_fr' => 'Youssef Amghar',
                    'tel' => '0644556677', 'echelle' => 9, 'echelon' => 4,
                    'anc_gen' => 8, 'anc_etab' => 2, 'date_install' => '2024-09-01',
                    'etab' => 'الثانوية الإعدادية ابن رشد', 'type_etab' => 'إعدادي',
                    'commune' => 'تاوريرت', 'dp' => 4, 'cadre' => 'أستاذ التعليم الثانوي الإعدادي',
                    'situation' => 'celibataire', 'conjoint' => null, 'enfants' => 0,
                    'merdoudia' => 'satisfactory',
                ]),
                'history' => [
                    ['2024-12-02 09:15:00', 'يوسف أمغار', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2025-01-15 11:00:00', 'ممثل المديرية - الدريوش', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                    ['2025-01-20 09:30:00', 'ممثل المديرية - الدريوش', 'transmitted_aref', 'إحالة الملف على الأكاديمية'],
                    ['2025-03-10 16:20:00', 'لجنة الأكاديمية', 'rejected', 'رفض الطلب: عدم استيفاء شروط الأولوية'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0006', 'status' => 'draft',
                'type_logement' => 'administratif', 'etablissement_cible' => 'المديرية الإقليمية بتاوريرت',
                'categorie' => 'سكن إداري', 'creation_date' => '2026-10-05',
                'bordereau' => null, 'transmission_date' => null,
                'decision_number' => null, 'decision_date' => null, 'audit_date' => null,
                'reasons' => null, 'docs' => [true, true, false, false, false, false],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0006', 'cin' => 'E998877',
                    'nom_ar' => 'كريم بوطالب', 'nom_fr' => 'Karim Boutaleb',
                    'tel' => '0622334455', 'echelle' => 11, 'echelon' => 5,
                    'anc_gen' => 10, 'anc_etab' => 3, 'date_install' => '2023-09-01',
                    'etab' => 'المديرية الإقليمية بتاوريرت', 'type_etab' => 'إدارة',
                    'commune' => 'تاوريرت', 'dp' => 4, 'cadre' => 'متصرف تربوي',
                    'situation' => 'marie', 'conjoint' => 'هدى الشرقاوي',
                    'conjoint_fonct' => true, 'enfants' => 1, 'merdoudia' => 'good',
                ]),
                'history' => [
                    ['2026-10-05 14:00:00', 'كريم بوطالب', 'submitted_dp', 'مسودة قيد الإيداع'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0007', 'status' => 'submitted_dp',
                'type_logement' => 'fonction', 'etablissement_cible' => 'مدرسة ابن بطوطة الابتدائية',
                'categorie' => 'سكن إداري', 'creation_date' => '2026-09-30',
                'bordereau' => null, 'transmission_date' => null,
                'decision_number' => null, 'decision_date' => null, 'audit_date' => null,
                'reasons' => null, 'docs' => [true, true, true, true, true, false],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0007', 'cin' => 'EA445566', 'gender' => 'female',
                    'nom_ar' => 'زينب الفيلالي', 'nom_fr' => 'Zineb Filali',
                    'tel' => '0688990011', 'echelle' => 10, 'echelon' => 6,
                    'anc_gen' => 15, 'anc_etab' => 6, 'date_install' => '2020-09-01',
                    'etab' => 'مدرسة ابن بطوطة الابتدائية', 'type_etab' => 'ابتدائي',
                    'commune' => 'جرسيف', 'dp' => 5, 'cadre' => 'أستاذة التعليم الابتدائي',
                    'situation' => 'marie', 'conjoint' => 'عادل بناني', 'enfants' => 2,
                    'merdoudia' => 'excellent',
                ]),
                'history' => [
                    ['2026-09-30 10:00:00', 'زينب الفيلالي', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0008', 'status' => 'submitted_dp',
                'type_logement' => 'fonction', 'etablissement_cible' => 'الثانوية التأهيلية جرادة',
                'categorie' => 'سكن تربوي', 'creation_date' => '2026-10-01',
                'bordereau' => null, 'transmission_date' => null,
                'decision_number' => null, 'decision_date' => null, 'audit_date' => null,
                'reasons' => null, 'docs' => [true, true, true, false, true, false],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0008', 'cin' => 'EC112233',
                    'nom_ar' => 'رشيد اليعقوبي', 'nom_fr' => 'Rachid Yacoubi',
                    'tel' => '0633221100', 'echelle' => 11, 'echelon' => 7,
                    'anc_gen' => 17, 'anc_etab' => 4, 'date_install' => '2022-09-01',
                    'etab' => 'الثانوية التأهيلية جرادة', 'type_etab' => 'ثانوي تأهيلي',
                    'commune' => 'جرادة', 'dp' => 6, 'cadre' => 'ناظر الدروس',
                    'situation' => 'marie', 'conjoint' => 'منيرة السعداني',
                    'conjoint_fonct' => true, 'enfants' => 3, 'merdoudia' => 'good',
                ]),
                'history' => [
                    ['2026-10-01 09:00:00', 'رشيد اليعقوبي', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0009', 'status' => 'approved',
                'type_logement' => 'administratif', 'etablissement_cible' => 'المديرية الإقليمية بفكيك',
                'categorie' => 'سكن إداري', 'creation_date' => '2024-06-15',
                'bordereau' => 'BORD/DP-FIG/2024/003', 'transmission_date' => '2024-08-10',
                'decision_number' => 'DEC/AREF/2024/077', 'decision_date' => '2024-09-20',
                'audit_date' => '2024-08-05', 'reasons' => null,
                'docs' => [true, true, true, true, true, true],
                'logement' => 'LOG-DEMO-0009',
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0009', 'cin' => 'ED778899',
                    'nom_ar' => 'إدريس أبايعيشو', 'nom_fr' => 'Idris Abayichu',
                    'tel' => '0699887766', 'echelle' => 12, 'echelon' => 5,
                    'anc_gen' => 28, 'anc_etab' => 15, 'date_install' => '2009-09-01',
                    'etab' => 'المديرية الإقليمية بفكيك', 'type_etab' => 'إدارة',
                    'commune' => 'فكيك', 'dp' => 7, 'cadre' => 'مسير المصالح المادية والمالية (مقتصد)',
                    'situation' => 'marie', 'conjoint' => 'خديجة بومالك', 'enfants' => 5,
                    'merdoudia' => 'satisfactory',
                ]),
                'history' => [
                    ['2024-06-15 08:45:00', 'إدريس أبايعيشو', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2024-08-05 11:15:00', 'ممثل المديرية - فكيك', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                    ['2024-08-10 09:00:00', 'ممثل المديرية - فكيك', 'transmitted_aref', 'إحالة الملف على الأكاديمية'],
                    ['2024-09-20 14:30:00', 'لجنة الأكاديمية', 'approved', 'المصادقة على إسناد السكن الإداري'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0010', 'status' => 'under_review_dp',
                'type_logement' => 'fonction', 'etablissement_cible' => 'مدرسة الوحدة - فرعية قروية',
                'categorie' => 'سكن تربوي', 'creation_date' => '2026-09-10',
                'bordereau' => null, 'transmission_date' => null,
                'decision_number' => null, 'decision_date' => null, 'audit_date' => '2026-10-02',
                'reasons' => null, 'docs' => [true, true, true, true, true, true],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0010', 'cin' => 'EE334455', 'gender' => 'female',
                    'nom_ar' => 'سلمى بوزيان', 'nom_fr' => 'Salma Bouziane',
                    'tel' => '0611223355', 'echelle' => 10, 'echelon' => 4,
                    'anc_gen' => 7, 'anc_etab' => 5, 'date_install' => '2021-09-01',
                    'etab' => 'مدرسة الوحدة - فرعية قروية', 'type_etab' => 'ابتدائي',
                    'commune' => 'بركمن (دائرة بوجدة)', 'cadre' => 'أستاذة التعليم الابتدائي',
                    'situation' => 'celibataire', 'conjoint' => null, 'enfants' => 0,
                    'merdoudia' => 'excellent', 'rural' => true, 'branche' => true,
                ]),
                'history' => [
                    ['2026-09-10 09:30:00', 'سلمى بوزيان', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2026-10-02 13:00:00', 'ممثل المديرية - وجدة أنكاد', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0011', 'status' => 'transmitted_aref',
                'type_logement' => 'fonction', 'etablissement_cible' => 'الثانوية الإعدادية العقاد',
                'categorie' => 'سكن تربوي', 'creation_date' => '2026-07-20',
                'bordereau' => 'BORD/DP-BRK/2026/019', 'transmission_date' => '2026-08-25',
                'decision_number' => null, 'decision_date' => null, 'audit_date' => '2026-08-20',
                'reasons' => null, 'docs' => [true, true, true, true, true, true],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0011', 'cin' => 'E556677',
                    'nom_ar' => 'عمر الصقلي', 'nom_fr' => 'Omar Sekkali',
                    'tel' => '0677665544', 'echelle' => 11, 'echelon' => 6,
                    'anc_gen' => 19, 'anc_etab' => 9, 'date_install' => '2017-09-01',
                    'etab' => 'الثانوية الإعدادية العقاد', 'type_etab' => 'إعدادي',
                    'commune' => 'بركان', 'dp' => 1, 'cadre' => 'رئيس أشغال',
                    'situation' => 'divorce', 'conjoint' => null, 'enfants' => 2,
                    'merdoudia' => 'good',
                ]),
                'history' => [
                    ['2026-07-20 10:45:00', 'عمر الصقلي', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2026-08-20 15:30:00', 'ممثل المديرية - بركان', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                    ['2026-08-25 09:10:00', 'ممثل المديرية - بركان', 'transmitted_aref', 'إحالة الملف على الأكاديمية'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0012', 'status' => 'approved',
                'type_logement' => 'fonction', 'etablissement_cible' => 'الثانوية التأهيلية الريف',
                'categorie' => 'سكن تربوي', 'creation_date' => '2026-03-15',
                'bordereau' => 'BORD/DP-NAD/2026/005', 'transmission_date' => '2026-05-10',
                'decision_number' => 'DEC/AREF/2026/044', 'decision_date' => '2026-09-05',
                'audit_date' => '2026-04-28', 'reasons' => null,
                'docs' => [true, true, true, true, true, true],
                'logement' => 'LOG-DEMO-0004',
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0012', 'cin' => 'EF889900',
                    'nom_ar' => 'حسن بنعلي', 'nom_fr' => 'Hassan Benali',
                    'tel' => '0600112233', 'echelle' => 12, 'echelon' => 4,
                    'anc_gen' => 13, 'anc_etab' => 7, 'date_install' => '2019-09-01',
                    'etab' => 'الثانوية التأهيلية الريف', 'type_etab' => 'ثانوي تأهيلي',
                    'commune' => 'الناظور', 'dp' => 2, 'cadre' => 'أستاذ التعليم الثانوي التأهيلي',
                    'situation' => 'marie', 'conjoint' => 'إيمان الحراق', 'enfants' => 2,
                    'merdoudia' => 'excellent',
                ]),
                'history' => [
                    ['2026-03-15 08:20:00', 'حسن بنعلي', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2026-04-28 12:40:00', 'ممثل المديرية - الناظور', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                    ['2026-05-10 09:00:00', 'ممثل المديرية - الناظور', 'transmitted_aref', 'إحالة الملف على الأكاديمية'],
                    ['2026-09-05 17:00:00', 'لجنة الأكاديمية', 'approved', 'المصادقة على إسناد السكن الوظيفي'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0013', 'status' => 'rejected',
                'type_logement' => 'administratif', 'etablissement_cible' => 'المديرية الإقليمية بالدريوش',
                'categorie' => 'سكن إداري', 'creation_date' => '2026-01-10',
                'bordereau' => 'BORD/DP-DRI/2026/002', 'transmission_date' => '2026-03-01',
                'decision_number' => 'DEC/AREF/2026/018', 'decision_date' => '2026-04-22',
                'audit_date' => '2026-02-25', 'reasons' => 'السكن المطلوب محجوز لمصلحة أخرى؛ يمكن تقديم طلب لاحق.',
                'docs' => [true, true, true, true, true, true],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0013', 'cin' => 'EB667788', 'gender' => 'female',
                    'nom_ar' => 'نادية بوعبيد', 'nom_fr' => 'Nadia Boubeid',
                    'tel' => '0644332211', 'echelle' => 9, 'echelon' => 5,
                    'anc_gen' => 11, 'anc_etab' => 4, 'date_install' => '2022-09-01',
                    'etab' => 'المديرية الإقليمية بالدريوش', 'type_etab' => 'إدارة',
                    'commune' => 'الدريوش', 'dp' => 3, 'cadre' => 'متصرف تربوي',
                    'situation' => 'veuf', 'conjoint' => null, 'enfants' => 1,
                    'merdoudia' => 'satisfactory',
                ]),
                'history' => [
                    ['2026-01-10 09:00:00', 'نادية بوعبيد', 'submitted_dp', 'إيداع الطلب بالمديرية الإقليمية'],
                    ['2026-02-25 14:10:00', 'ممثل المديرية - الدريوش', 'under_review_dp', 'تدقيق محلي: اكتمال الوثائق'],
                    ['2026-03-01 10:00:00', 'ممثل المديرية - الدريوش', 'transmitted_aref', 'إحالة الملف على الأكاديمية'],
                    ['2026-04-22 16:00:00', 'لجنة الأكاديمية', 'rejected', 'رفض الطلب: السكن محجوز'],
                ],
            ],
            [
                'numero' => 'DOS-DEMO-0014', 'status' => 'draft',
                'type_logement' => 'fonction', 'etablissement_cible' => 'مدرسة ابن بطوطة الابتدائية',
                'categorie' => 'سكن إداري', 'creation_date' => '2026-10-09',
                'bordereau' => null, 'transmission_date' => null,
                'decision_number' => null, 'decision_date' => null, 'audit_date' => null,
                'reasons' => null, 'docs' => [true, false, false, false, false, false],
                'candidat' => $c([
                    'ppr' => 'PPR-DEMO-0014', 'cin' => 'EA990011',
                    'nom_ar' => 'توفيق المرابط', 'nom_fr' => 'Tawfiq El Morabit',
                    'tel' => '0655667788', 'echelle' => 10, 'echelon' => 5,
                    'anc_gen' => 16, 'anc_etab' => 6, 'date_install' => '2020-09-01',
                    'etab' => 'مدرسة ابن بطوطة الابتدائية', 'type_etab' => 'ابتدائي',
                    'commune' => 'جرسيف', 'dp' => 5, 'cadre' => 'أستاذ التعليم الابتدائي',
                    'situation' => 'marie', 'conjoint' => 'رشاء بلقاسم',
                    'conjoint_fonct' => true, 'enfants' => 2, 'merdoudia' => 'good',
                ]),
                'history' => [
                    ['2026-10-09 11:00:00', 'توفيق المرابط', 'submitted_dp', 'مسودة قيد الإيداع'],
                ],
            ],
        ];
    }

    private function seedEvictions(): void
    {
        DB::table('eviction_procedures')->insert([
            [
                'numero_dossier' => 'DOS-DEMO-0009',
                'case_type' => 'retraite',
                'trigger_date' => '2026-02-01',
                'deadline_months' => 0,
                'deadline_date' => null,
                'deadline_extended' => true,
                'status' => 'notified',
                'notice_sent_date' => '2026-03-15',
                'vacate_date' => null,
                'rent_amount' => null,
                'notes' => 'إحالة على التقاعد؛ الأجل ممدد إلى غاية تسلم المعاش.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'numero_dossier' => 'DOS-DEMO-0004',
                'case_type' => 'cessation_travail',
                'trigger_date' => '2026-05-10',
                'deadline_months' => 2,
                'deadline_date' => '2026-07-10',
                'deadline_extended' => false,
                'status' => 'judicial',
                'notice_sent_date' => '2026-05-25',
                'vacate_date' => null,
                'rent_amount' => 1200.00,
                'notes' => 'انقطاع عن العمل دون مبرر؛ متابعة قضائية بعد الامتناع عن الإفراغ.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
