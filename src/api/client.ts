import { HousingDossier, DossierStatus } from '../types/housing';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.message || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return body;
}

const HOUSING_STATUS_TO_API: Record<string, string> = {
  vacant: 'vacant',
  occupied_to_evict: 'occupe_a_evacuer',
  under_maintenance: 'en_maintenance',
};
const HOUSING_STATUS_FROM_API: Record<string, string> = {
  vacant: 'vacant',
  occupe_a_evacuer: 'occupied_to_evict',
  en_maintenance: 'under_maintenance',
};

function inferAuditStage(decision: string, index: number): string {
  if (index === 0 || decision.includes('Création') || decision.includes('إيداع')) return 'creation';
  if (decision.includes('تدقيق')) return 'audit_dp';
  if (decision.includes('إحالة') || decision.includes('إرسال')) return 'transmission_aref';
  if (decision.includes('المصادقة') || decision.includes('الترخيص')) return 'final_decision';
  return 'audit_dp';
}

// Maps the flat Laravel `demandes_logement` JSON shape (with nested
// candidat/bareme/documents/historique) to the richer frontend HousingDossier
// shape. Fields the backend doesn't store yet (per-document metadata beyond a
// present flag, dpAudit/arefDecision sub-objects) are left undefined/false —
// callers that need them locally should merge on top of this result.
export function mapApiToDossier(api: any): HousingDossier {
  const c = api.candidat || {};
  const b = api.bareme || {};
  const docs = api.documents || {};

  return {
    id: String(api.id),
    referenceNumber: api.numero_dossier,
    creationDate: (api.date_creation || '').slice(0, 10),
    status: api.statut_dossier as DossierStatus,
    candidate: {
      fullNameAr: c.nom_ar || '',
      fullNameFr: c.nom_fr || '',
      cin: c.cin || '',
      ppr: c.ppr || '',
      phone: c.telephone || '',
      email: c.email || '',
      grade: c.cadre || '',
      scale: c.echelle ?? 0,
      echelon: c.echelon ?? 0,
      seniorityGeneral: c.anciennete_generale ?? 0,
      seniorityEtablissement: c.anciennete_etablissement ?? 0,
      installationDate: (c.date_installation || '').slice(0, 10),
      currentEtablissement: c.etablissement_actuel || '',
      etablissementType: c.type_etablissement || '',
      commune: c.commune || '',
      directionProvinciale: c.direction_provinciale || '',
      aref: c.aref || '',
    },
    situationFamiliale: {
      maritalStatus: c.situation_familiale || 'celibataire',
      spouseName: c.nom_conjoint || '',
      spouseIsPublicOfficial: !!c.conjoint_fonctionnaire,
      spouseAdministration: c.administration_conjoint || '',
      spousePPR: c.ppr_conjoint || '',
      childrenCount: c.nombre_enfants ?? 0,
    },
    housingRequest: {
      housingType: api.type_logement,
      targetEtablissement: api.etablissement_cible || '',
      housingCategory: api.categorie_logement || '',
      housingAddress: api.adresse_logement || '',
      housingNumber: api.numero_logement || '',
      housingStatus: (HOUSING_STATUS_FROM_API[api.statut_logement] || 'vacant') as any,
      reasons: api.reasons || '',
    },
    documents: {
      demandeManuscrite: { present: !!docs.demande_manuscrite },
      copieCIN: { present: !!docs.copie_cin },
      attestationTravail: { present: !!docs.attestation_travail },
      situationFamiliale: {
        present: !!docs.situation_familiale,
        marriageCert: false,
        spouseAttestation: false,
        childrenCertificates: false,
      },
      engagementHonneur: { present: !!docs.engagement_honneur },
      pvInstallation: { present: !!docs.pv_installation },
    },
    bareme: {
      seniorityGeneralPts: b.pts_anciennete_generale ?? 0,
      seniorityEtablissementPts: b.pts_anciennete_etablissement ?? 0,
      scalePts: b.pts_echelle ?? 0,
      maritalPts: b.pts_situation_familiale ?? 0,
      childrenPts: b.pts_enfants ?? 0,
      responsibilityBonus: b.bonus_responsabilite ?? 0,
      totalPts: b.total_points ?? 0,
    },
    auditHistory: (api.historique || []).map((h: any, i: number) => ({
      stage: inferAuditStage(h.decision || '', i) as any,
      date: h.date_action,
      actor: h.acteur,
      decision: h.decision,
      comment: h.commentaire || '',
    })),
    dpAudit: {
      bordereauNumber: api.numero_bordereau_dp || undefined,
      transmissionDate: api.date_transmission_aref || undefined,
      isComplete: Object.values(docs).every(Boolean),
    },
    arefDecision: {
      decisionNumber: api.numero_decision_aref || undefined,
      commissionDate: api.date_commission_aref || undefined,
    },
  };
}

function buildCreatePayload(dossier: HousingDossier) {
  const c = dossier.candidate;
  const f = dossier.situationFamiliale;
  const h = dossier.housingRequest;
  const bareme = dossier.bareme;
  const docs = dossier.documents;

  return {
    candidat: {
      ppr: c.ppr,
      cin: c.cin,
      nom_ar: c.fullNameAr,
      nom_fr: c.fullNameFr,
      telephone: c.phone,
      email: c.email,
      cadre: c.grade,
      echelle: c.scale,
      echelon: c.echelon,
      anciennete_generale: c.seniorityGeneral,
      anciennete_etablissement: c.seniorityEtablissement,
      date_installation: c.installationDate,
      etablissement_actuel: c.currentEtablissement,
      type_etablissement: c.etablissementType,
      commune: c.commune,
      direction_provinciale: c.directionProvinciale,
      aref: c.aref,
      situation_familiale: f.maritalStatus,
      nom_conjoint: f.spouseName,
      conjoint_fonctionnaire: f.spouseIsPublicOfficial,
      administration_conjoint: f.spouseAdministration,
      ppr_conjoint: f.spousePPR,
      nombre_enfants: f.childrenCount,
    },
    type_logement: h.housingType,
    etablissement_cible: h.targetEtablissement,
    categorie_logement: h.housingCategory,
    adresse_logement: h.housingAddress,
    numero_logement: h.housingNumber,
    statut_logement: HOUSING_STATUS_TO_API[h.housingStatus] || 'vacant',
    statut_dossier: dossier.status,
    date_creation: dossier.creationDate,
    reasons: h.reasons,
    pts_anciennete_generale: bareme.seniorityGeneralPts,
    pts_anciennete_etablissement: bareme.seniorityEtablissementPts,
    pts_echelle: bareme.scalePts,
    pts_situation_familiale: bareme.maritalPts,
    pts_enfants: bareme.childrenPts,
    bonus_responsabilite: bareme.responsibilityBonus,
    documents: {
      demande_manuscrite: docs.demandeManuscrite.present,
      copie_cin: docs.copieCIN.present,
      attestation_travail: docs.attestationTravail.present,
      situation_familiale: docs.situationFamiliale.present,
      engagement_honneur: docs.engagementHonneur.present,
      pv_installation: docs.pvInstallation.present,
    },
  };
}

export async function fetchDossiers(): Promise<HousingDossier[]> {
  const body = await request('/assignments');
  return (body.data || []).map(mapApiToDossier);
}

export async function createDossier(dossier: HousingDossier): Promise<HousingDossier> {
  const body = await request('/assignments', {
    method: 'POST',
    body: JSON.stringify(buildCreatePayload(dossier)),
  });
  return mapApiToDossier(body.data);
}

export async function updateDossierStatus(
  id: string,
  changes: {
    status?: DossierStatus;
    comment?: string;
    acteur?: string;
    numero_bordereau_dp?: string;
    date_transmission_aref?: string;
    numero_decision_aref?: string;
    date_commission_aref?: string;
    reasons?: string;
  }
): Promise<HousingDossier> {
  const { comment, ...rest } = changes;
  const body = await request(`/assignments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ ...rest, commentaire: comment }),
  });
  return mapApiToDossier(body.data);
}
