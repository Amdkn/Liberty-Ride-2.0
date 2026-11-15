import { HumanGateId, HumanGateRecord } from './types';

export const INITIAL_HUMAN_GATES: Record<HumanGateId, HumanGateRecord> = {
  GATE_KYTC_FILING: {
    id: 'GATE_KYTC_FILING',
    title: 'Soumission Réglementaire KYTC',
    domain: 'LEGAL',
    description:
      'Dépôt officiel des certificats de transporteur de passagers auprès du Kentucky Transportation Cabinet (KYTC).',
    thresholdRule: 'Signature cryptographique A0 Amadeus requise avant tout envoi officiel.',
    status: 'APPROVED_BY_A0',
    lastSignedAt: '2026-11-15T08:05:00.000Z',
    signatureHash: 'A0-SIG-KYTC-99812A',
  },
  GATE_FLEET_INSURANCE: {
    id: 'GATE_FLEET_INSURANCE',
    title: 'Polices Assurance Commerciale Flotte SUV',
    domain: 'LEGAL',
    description:
      'Souscription ou modification des polices responsabilité civile commerciale $1,000,000 CSL pour les 3 SUV noirs.',
    thresholdRule: 'Couverture minimale $1M CSL + Validation exclusive A0 Amadeus.',
    status: 'APPROVED_BY_A0',
    lastSignedAt: '2026-11-15T08:06:00.000Z',
    signatureHash: 'A0-SIG-INS-44109B',
  },
  GATE_CVG_PRICING: {
    id: 'GATE_CVG_PRICING',
    title: 'Grille Tarifaire Officielle Erlanger / CVG',
    domain: 'FINANCE',
    description:
      'Modification des tarifs garantis sur le corridor Erlanger ($48) <-> CVG Airport <-> Downtown Cincinnati ($65).',
    thresholdRule: 'Revenu horaire net chauffeur >= $45.00/h + Approbation A0 Amadeus.',
    status: 'LOCKED',
    lastSignedAt: '2026-11-15T08:07:00.000Z',
  },
  GATE_TREASURY_500: {
    id: 'GATE_TREASURY_500',
    title: 'Décaissements & Engagements > $500 USD',
    domain: 'FINANCE',
    description:
      'Tout virement bancaire, achat d’équipement garage ou dépense fournisseur excédant $500.00 USD.',
    thresholdRule: 'Blocage automatique au-dessus de $500.00 USD sans jeton A0.',
    status: 'LOCKED',
    lastSignedAt: '2026-11-15T08:08:00.000Z',
  },
  GATE_B2B_CONTRACTS: {
    id: 'GATE_B2B_CONTRACTS',
    title: 'Signature Contrats B2B Hôtels & Corporate',
    domain: 'SALES',
    description:
      'Contrats de navettes prioritaires avec les hôtels de la zone CVG et sièges sociaux de Cincinnati.',
    thresholdRule: 'Marge brute >= 22% + Signature finale A0 Amadeus.',
    status: 'LOCKED',
    lastSignedAt: '2026-11-15T08:09:00.000Z',
  },
};

export function detectRequiredHumanGate(title: string, amountUsd?: number): HumanGateId | undefined {
  const lower = title.toLowerCase();
  if (amountUsd && amountUsd > 500) return 'GATE_TREASURY_500';
  if (lower.includes('kytc') || lower.includes('permis') || lower.includes('cabinet')) {
    return 'GATE_KYTC_FILING';
  }
  if (lower.includes('assurance') || lower.includes('insurance') || lower.includes('police')) {
    return 'GATE_FLEET_INSURANCE';
  }
  if (lower.includes('tarif') || lower.includes('prix') || lower.includes('pricing') || lower.includes('grille')) {
    return 'GATE_CVG_PRICING';
  }
  if (lower.includes('$500') || lower.includes('décaissement') || lower.includes('paiement')) {
    return 'GATE_TREASURY_500';
  }
  if (lower.includes('contrat b2b') || lower.includes('hôtel') || lower.includes('hotel') || lower.includes('corporate')) {
    return 'GATE_B2B_CONTRACTS';
  }
  return undefined;
}

export function signHumanGateByA0(
  gate: HumanGateRecord,
  decision: 'APPROVED_BY_A0' | 'REJECTED_BY_A0'
): HumanGateRecord {
  const now = new Date().toISOString();
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return {
    ...gate,
    status: decision,
    lastSignedAt: now,
    signatureHash: `A0-${decision === 'APPROVED_BY_A0' ? 'PASS' : 'DENY'}-${suffix}`,
  };
}
